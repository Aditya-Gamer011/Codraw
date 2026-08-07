import { ProjectFiles } from "./types";

const githubApiBase = "https://api.github.com";
const githubCookieName = "codraw_github_token";

type GitHubRepo = {
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  default_branch: string;
  html_url: string;
  private: boolean;
};

type GitHubRef = {
  object: {
    sha: string;
  };
};

type GitHubContent = {
  sha?: string;
};

function parseCookieHeader(cookieHeader: string | null) {
  return Object.fromEntries(
    (cookieHeader ?? "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        if (index === -1) return [cookie, ""];

        return [
          cookie.slice(0, index),
          decodeURIComponent(cookie.slice(index + 1)),
        ];
      })
  );
}

export function getGitHubToken(req: Request) {
  return parseCookieHeader(req.headers.get("cookie"))[
    githubCookieName
  ];
}

export function getGitHubCookieName() {
  return githubCookieName;
}

export async function githubFetch<T>(
  token: string,
  path: string,
  init: RequestInit = {}
) {
  const response = await fetch(`${githubApiBase}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `GitHub API error ${response.status}: ${message}`
    );
  }

  return (await response.json()) as T;
}

export function encodeFile(content: string) {
  return Buffer.from(content, "utf8").toString("base64");
}

function encodeRepoPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function getExistingFileSha(
  token: string,
  owner: string,
  repo: string,
  path: keyof ProjectFiles,
  branch: string
) {
  const encodedPath = encodeRepoPath(path);
  const encodedBranch = encodeURIComponent(branch);
  const response = await fetch(
    `${githubApiBase}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodedBranch}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) return undefined;

  if (!response.ok) {
    throw new Error(
      `GitHub API error ${response.status}: ${await response.text()}`
    );
  }

  const content = (await response.json()) as GitHubContent;
  return content.sha;
}

export async function writeProjectFiles(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  files: ProjectFiles,
  message: string
) {
  // 1. Get current branch HEAD commit
  const ref = await githubFetch<GitHubRef>(
    token,
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`
  );
  const latestCommitSha = ref.object.sha;

  // 2. Get latest commit's tree SHA
  const latestCommit = await githubFetch<{ tree: { sha: string } }>(
    token,
    `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`
  );
  const baseTreeSha = latestCommit.tree.sha;

  // 3. Create blob objects for all files
  const treeItems = [];
  for (const [path, content] of Object.entries(files)) {
    const isBinaryDataUrl = typeof content === "string" && content.startsWith("data:") && content.includes(";base64,");
    const blobContent = isBinaryDataUrl ? content.split(";base64,")[1] : content;
    const encoding = isBinaryDataUrl ? "base64" : "utf-8";

    const blob = await githubFetch<{ sha: string }>(
      token,
      `/repos/${owner}/${repo}/git/blobs`,
      {
        method: "POST",
        body: JSON.stringify({
          content: blobContent,
          encoding,
        }),
      }
    );

    treeItems.push({
      path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  // 4. Create new tree referencing baseTreeSha
  const newTree = await githubFetch<{ sha: string }>(
    token,
    `/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    }
  );

  // 5. Create 1 single commit
  const newCommit = await githubFetch<{ sha: string }>(
    token,
    `/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: newTree.sha,
        parents: [latestCommitSha],
      }),
    }
  );

  // 6. Update branch head to new commit
  await githubFetch(
    token,
    `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        sha: newCommit.sha,
        force: false,
      }),
    }
  );
}

export async function getRepo(
  token: string,
  owner: string,
  repo: string
) {
  return githubFetch<GitHubRepo>(
    token,
    `/repos/${owner}/${repo}`
  );
}

export async function createUpdateBranch(
  token: string,
  owner: string,
  repo: string,
  baseBranch: string
) {
  const branchName = `codraw-updates-${Date.now()}`;
  const ref = await githubFetch<GitHubRef>(
    token,
    `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`
  );

  await githubFetch(token, `/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    }),
  });

  return branchName;
}
