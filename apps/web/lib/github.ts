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

function encodeFile(content: string) {
  return Buffer.from(content, "utf8").toString("base64");
}

function encodeRepoPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function getExistingFileSha(
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
  for (const path of Object.keys(files) as (keyof ProjectFiles)[]) {
    const sha = await getExistingFileSha(
      token,
      owner,
      repo,
      path,
      branch
    );

    await githubFetch(
      token,
      `/repos/${owner}/${repo}/contents/${encodeRepoPath(path)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: encodeFile(files[path]),
          branch,
          ...(sha ? { sha } : {}),
        }),
      }
    );
  }
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
