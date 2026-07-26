"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  Download,
  ExternalLink,
  FolderOpen,
  GitBranch,
  GitPullRequest,
  LogOut,
  MousePointer2,
  Plus,
  Redo2,
  Rocket,
  Sparkles,
  Undo2,
  UploadCloud,
} from "lucide-react";

import { useEditorStore } from "@/lib/editorStore";
import { ProjectFiles } from "@/lib/types";

type Props = {
  visualEditEnabled: boolean;
  onVisualEditChange: (enabled: boolean) => void;
  aiOpen: boolean;
  onAiToggle: () => void;
};

type GitHubUser = {
  login: string;
  avatar_url: string;
  html_url: string;
};

type RepoOption = {
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
  htmlUrl: string;
  defaultBranch: string;
};

export default function Toolbar({
  visualEditEnabled,
  onVisualEditChange,
  aiOpen,
  onAiToggle,
}: Props) {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);

  const [projectOpen, setProjectOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [githubUser, setGithubUser] =
    useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const [selectedRepo, setSelectedRepo] =
    useState<RepoOption | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(
    null
  );

  const projectRef = useRef<HTMLDivElement>(null);
  const githubRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;

      if (!projectRef.current?.contains(target)) {
        setProjectOpen(false);
      }

      if (!githubRef.current?.contains(target)) {
        setGithubOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClick);

    return () =>
      window.removeEventListener("mousedown", handleClick);
  }, []);

  const refreshRepos = useCallback(async () => {
    const res = await fetch("/api/github/repos");
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Could not load GitHub repos.");
      return;
    }

    setRepos(data.repos);
    setSelectedRepo((current) => current ?? data.repos[0] ?? null);
  }, []);

  const refreshGitHubStatus = useCallback(async () => {
    const res = await fetch("/api/github/status");
    const data = await res.json();

    if (!data.connected) {
      setGithubUser(null);
      setRepos([]);
      setSelectedRepo(null);
      return;
    }

    setGithubUser(data.user);
    await refreshRepos();
  }, [refreshRepos]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      refreshGitHubStatus();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refreshGitHubStatus]);

  async function runGitHubAction<T>(
    action: string,
    task: () => Promise<T>
  ) {
    setBusyAction(action);

    try {
      return await task();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "GitHub action failed."
      );
    } finally {
      setBusyAction(null);
    }
  }

  function connectGitHub() {
    window.location.href = "/api/github/login";
  }

  function downloadFile(
    filename: string,
    content: string,
    type: string
  ) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function saveProjectBundle() {
    downloadFile(
      "codraw-project.json",
      JSON.stringify(files, null, 2),
      "application/json"
    );
    setProjectOpen(false);
  }

  function openProjectBundle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imported = JSON.parse(
          String(reader.result)
        ) as Partial<ProjectFiles>;

        if (
          typeof imported["index.html"] !== "string" ||
          typeof imported["style.css"] !== "string" ||
          typeof imported["script.js"] !== "string"
        ) {
          throw new Error("Invalid Codraw project file.");
        }

        setFiles({
          "index.html": imported["index.html"],
          "style.css": imported["style.css"],
          "script.js": imported["script.js"],
        });
        setProjectOpen(false);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Could not open project file."
        );
      }
    };

    reader.readAsText(file);
  }

  function exportWebsite() {
    const styleTag = `<style>\n${files["style.css"]}\n</style>`;
    const scriptTag = `<script>\n${files["script.js"]}\n</script>`;
    const htmlWithStyles = files["index.html"].includes("</head>")
      ? files["index.html"].replace(
          "</head>",
          `${styleTag}\n</head>`
        )
      : `${styleTag}\n${files["index.html"]}`;
    const htmlWithScript = htmlWithStyles.includes("</body>")
      ? htmlWithStyles.replace(
          "</body>",
          `${scriptTag}\n</body>`
        )
      : `${htmlWithStyles}\n${scriptTag}`;

    downloadFile("codraw-site.html", htmlWithScript, "text/html");
    setProjectOpen(false);
  }

  async function logoutGitHub() {
    await fetch("/api/github/logout", {
      method: "POST",
    });
    setGithubUser(null);
    setRepos([]);
    setSelectedRepo(null);
  }

  async function createRepo() {
    const name = prompt("Repository name");

    if (!name?.trim()) return;

    const makePrivate = confirm("Make this repository private?");

    await runGitHubAction("create", async () => {
      const res = await fetch("/api/github/repos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          private: makePrivate,
          files,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not create repo.");
      }

      setSelectedRepo(data.repo);
      await refreshRepos();
      alert(`Created ${data.repo.fullName}`);
    });
  }

  async function commitChanges() {
    if (!selectedRepo) {
      alert("Select or create a GitHub repository first.");
      return;
    }

    await runGitHubAction("commit", async () => {
      const res = await fetch("/api/github/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: selectedRepo.owner,
          repo: selectedRepo.name,
          files,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not commit changes.");
      }

      alert(`Committed to ${selectedRepo.fullName}`);
    });
  }

  async function createPullRequest() {
    if (!selectedRepo) {
      alert("Select or create a GitHub repository first.");
      return;
    }

    const title =
      prompt("Pull request title", "Update website from Codraw") ??
      "Update website from Codraw";

    await runGitHubAction("pr", async () => {
      const res = await fetch("/api/github/pull-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: selectedRepo.owner,
          repo: selectedRepo.name,
          title,
          files,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not create PR.");
      }

      window.open(data.htmlUrl, "_blank", "noopener,noreferrer");
    });
  }

  const isBusy = busyAction !== null;

  return (
    <div className="sleek-panel flex h-12 items-center border-b px-4 text-white">
      <div className="mr-6 text-sm font-semibold tracking-wide text-zinc-100">
        Codraw
      </div>

      <div className="relative" ref={projectRef}>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={openProjectBundle}
        />

        <button
          onClick={() => setProjectOpen((v) => !v)}
          className="sleek-button flex h-8 items-center gap-2 rounded border px-3 text-sm"
        >
          Project
          <ChevronDown size={15} />
        </button>

        {projectOpen && (
          <div className="absolute left-0 top-10 z-50 w-64 rounded-lg border border-zinc-800 bg-zinc-950 py-1 shadow-xl">
            <button
              onClick={() => importRef.current?.click()}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              <FolderOpen size={16} />
              Open Project...
            </button>

            <button
              onClick={saveProjectBundle}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              Save Project As...
            </button>

            <div className="my-1 border-t border-zinc-800" />

            <button
              onClick={exportWebsite}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              <Download size={16} />
              Export Website (.html)
            </button>
          </div>
        )}
      </div>

      <div className="mx-4 h-5 w-px bg-zinc-700" />

      <button
        disabled
        className="sleek-button grid h-8 w-8 place-items-center rounded border opacity-50"
        title="Undo"
      >
        <Undo2 size={16} />
      </button>

      <button
        disabled
        className="sleek-button ml-2 grid h-8 w-8 place-items-center rounded border opacity-50"
        title="Redo"
      >
        <Redo2 size={16} />
      </button>

      <div className="mx-4 h-5 w-px bg-zinc-700" />

      <button
        aria-pressed={visualEditEnabled}
        onClick={() =>
          onVisualEditChange(!visualEditEnabled)
        }
        className={`flex h-8 items-center gap-2 rounded border px-3 text-sm transition ${
          visualEditEnabled
            ? "sleek-button-active"
            : "sleek-button"
        }`}
      >
        <MousePointer2 size={15} />
        Visual Edit
      </button>

      <div className="mx-4 h-5 w-px bg-zinc-700" />

      <button
        aria-pressed={aiOpen}
        onClick={onAiToggle}
        className={`flex h-8 items-center gap-2 rounded border px-3 text-sm transition ${
          aiOpen ? "sleek-button-active" : "sleek-button"
        }`}
      >
        <Sparkles size={15} />
        AI
      </button>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative" ref={githubRef}>
          <button
            onClick={() => setGithubOpen((v) => !v)}
            className="flex h-8 items-center gap-2 rounded-md border border-zinc-700/60 bg-zinc-900/80 px-3 text-xs font-medium text-zinc-200 shadow-sm backdrop-blur-md transition-all hover:border-zinc-500 hover:bg-zinc-800/90 active:scale-[0.98]"
          >
            <GitBranch size={14} className="text-zinc-400" />
            <span>{githubUser ? githubUser.login : "GitHub"}</span>
            <ChevronDown size={13} className="text-zinc-400" />
          </button>

          {githubOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-zinc-800/90 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl">
              {!githubUser ? (
                <div className="flex flex-col items-center text-center space-y-3 py-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 shadow-inner">
                    <GitBranch size={20} className="text-zinc-200" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-zinc-100">Connect to GitHub</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed px-1">
                      Sign in to sync your repository, push direct commits, and submit pull requests.
                    </p>
                  </div>
                  <button
                    onClick={connectGitHub}
                    className="group flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-white hover:shadow-lg hover:shadow-white/10 active:scale-[0.98]"
                  >
                    <GitBranch size={16} className="transition-transform group-hover:scale-110" />
                    <span>Connect GitHub</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-medium text-zinc-200">{githubUser.login}</span>
                    </div>
                    <a
                      href={githubUser.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-400 hover:text-white transition-colors"
                      title="View Profile"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <select
                    value={selectedRepo?.fullName ?? ""}
                    onChange={(event) => {
                      const repo =
                        repos.find(
                          (item) =>
                            item.fullName === event.target.value
                        ) ?? null;
                      setSelectedRepo(repo);
                    }}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-200 outline-none transition focus:border-zinc-600"
                  >
                    {repos.length === 0 ? (
                      <option value="">No repos loaded</option>
                    ) : (
                      repos.map((repo) => (
                        <option
                          key={repo.fullName}
                          value={repo.fullName}
                        >
                          {repo.fullName}
                        </option>
                      ))
                    )}
                  </select>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      disabled={isBusy}
                      onClick={createRepo}
                      className="sleek-button flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"
                    >
                      <Plus size={14} />
                      New repo
                    </button>

                    <button
                      disabled={isBusy}
                      onClick={refreshRepos}
                      className="sleek-button rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"
                    >
                      Refresh
                    </button>

                    <button
                      disabled={isBusy || !selectedRepo}
                      onClick={commitChanges}
                      className="sleek-button flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"
                    >
                      <UploadCloud size={14} />
                      Commit
                    </button>

                    <button
                      disabled={isBusy || !selectedRepo}
                      onClick={createPullRequest}
                      className="sleek-button flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50"
                    >
                      <GitPullRequest size={14} />
                      PR
                    </button>
                  </div>

                  <button
                    disabled={isBusy}
                    onClick={logoutGitHub}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"
                  >
                    <LogOut size={14} />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          disabled={!selectedRepo}
          onClick={commitChanges}
          className="flex h-8 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          <Rocket size={15} />
          Publish
        </button>
      </div>
    </div>
  );
}
