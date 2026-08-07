"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Boxes,
  ChevronDown,
  Command,
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
import CustomModal, { ModalState } from "@/components/Modal/CustomModal";
import CommandPalette from "@/components/CommandPalette/CommandPalette";
import JSZip from "jszip";

type Props = {
  visualEditEnabled: boolean;
  onVisualEditChange: (enabled: boolean) => void;
  aiOpen: boolean;
  onAiToggle: () => void;
  elementsOpen?: boolean;
  onElementsToggle?: () => void;
  onReplayIntro?: () => void;
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
  elementsOpen = false,
  onElementsToggle,
  onReplayIntro,
}: Props) {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const addFile = useEditorStore((s) => s.addFile);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [githubPos, setGithubPos] = useState<{ top: number; right: number }>({ top: 56, right: 16 });
  const [projectPos, setProjectPos] = useState<{ top: number; left: number }>({ top: 56, left: 16 });
  const [githubUser, setGithubUser] =
    useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const [selectedRepo, setSelectedRepo] =
    useState<RepoOption | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(
    null
  );
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [lastCommittedFiles, setLastCommittedFiles] = useState<ProjectFiles | null>(null);
  const [lastPublishedFiles, setLastPublishedFiles] = useState<ProjectFiles | null>(null);

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  function requestInput(options: Omit<ModalState, "isOpen" | "mode">): Promise<{ confirmed: boolean; text: string; checkbox: boolean }> {
    return new Promise((resolve) => {
      setModalState({
        ...options,
        isOpen: true,
        mode: "input",
        onResolve: resolve,
      });
    });
  }

  function requestConfirm(options: Omit<ModalState, "isOpen" | "mode">): Promise<boolean> {
    return new Promise((resolve) => {
      setModalState({
        ...options,
        isOpen: true,
        mode: "confirm",
        onResolve: (res) => resolve(res.confirmed),
      });
    });
  }

  function requestAlert(options: Omit<ModalState, "isOpen" | "mode">): Promise<void> {
    return new Promise((resolve) => {
      setModalState({
        ...options,
        isOpen: true,
        mode: "alert",
        onResolve: () => resolve(),
      });
    });
  }

  function hasUncommittedChanges(): boolean {
    if (!lastCommittedFiles) return true;
    return (
      files["index.html"] !== lastCommittedFiles["index.html"] ||
      files["style.css"] !== lastCommittedFiles["style.css"] ||
      files["script.js"] !== lastCommittedFiles["script.js"]
    );
  }

  function hasUnpublishedChanges(): boolean {
    if (!lastPublishedFiles) return true;
    return (
      files["index.html"] !== lastPublishedFiles["index.html"] ||
      files["style.css"] !== lastPublishedFiles["style.css"] ||
      files["script.js"] !== lastPublishedFiles["script.js"]
    );
  }

  async function pollPagesStatus(owner: string, repo: string) {
    const maxAttempts = 15;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const res = await fetch(`/api/github/pages?owner=${owner}&repo=${repo}`);
        const data = await res.json();
        if (data.isLive) return true;
      } catch {
        // Continue polling
      }
      await new Promise((r) => setTimeout(r, 2500));
    }
    return true;
  }

  const projectRef = useRef<HTMLDivElement>(null);
  const projectBtnRef = useRef<HTMLButtonElement>(null);
  const githubBtnRef = useRef<HTMLButtonElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Outside-click handlers removed — both dropdowns now use
  // transparent backdrop overlays for clean close-on-click-outside.

  const refreshRepos = useCallback(async () => {
    const res = await fetch("/api/github/repos");
    const data = await res.json();

    if (!res.ok) {
      await requestAlert({
        title: "Repository Error",
        description: data.error || "Could not load GitHub repos.",
        icon: "alert",
        variant: "danger",
      });
      return;
    }

    setRepos(data.repos);
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
      await requestAlert({
        title: "Action Failed",
        description: error instanceof Error ? error.message : "GitHub action failed.",
        icon: "alert",
        variant: "danger",
      });
    } finally {
      setBusyAction(null);
    }
  }

  function connectGitHub() {
    window.location.href = "/api/github/login";
  }

  async function saveProjectFolder() {
    const folderName = selectedRepo ? selectedRepo.name : "Codraw Project";

    if ("showDirectoryPicker" in window) {
      try {
        const pickerWindow = window as unknown as {
          showDirectoryPicker: (opts: { mode: string }) => Promise<FileSystemDirectoryHandle>;
        };
        const parentHandle = await pickerWindow.showDirectoryPicker({
          mode: "readwrite",
        });

        const targetDirHandle = await parentHandle.getDirectoryHandle(folderName, {
          create: true,
        });

        for (const [filename, content] of Object.entries(files)) {
          const parts = filename.split("/");
          let currentDir = targetDirHandle;
          for (let i = 0; i < parts.length - 1; i++) {
            currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
          }
          const baseName = parts[parts.length - 1];

          const fileHandle = await currentDir.getFileHandle(baseName, { create: true });
          const writable = await fileHandle.createWritable();

          if (typeof content === "string" && content.startsWith("data:") && content.includes(";base64,")) {
            const res = await fetch(content);
            const blob = await res.blob();
            await writable.write(blob);
          } else {
            await writable.write(content);
          }
          await writable.close();
        }

        await requestAlert({
          title: "Project Saved!",
          description: `Successfully saved all project files and assets into folder "${folderName}".`,
          icon: "success",
          variant: "success",
        });
        setProjectOpen(false);
        return;
      } catch (err: unknown) {
        if (err && typeof err === "object" && "name" in err && err.name === "AbortError") {
          setProjectOpen(false);
          return;
        }
      }
    }

    const zip = new JSZip();
    const folder = zip.folder(folderName) || zip;

    for (const [filename, content] of Object.entries(files)) {
      if (typeof content === "string" && content.startsWith("data:") && content.includes(";base64,")) {
        const base64Data = content.split(";base64,")[1];
        folder.file(filename, base64Data, { base64: true });
      } else {
        folder.file(filename, content);
      }
    }

    const zipContent = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipContent);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${folderName}.zip`;
    link.click();
    URL.revokeObjectURL(url);

    await requestAlert({
      title: "Project Saved!",
      description: `Saved project folder as "${folderName}.zip".`,
      icon: "success",
      variant: "success",
    });
    setProjectOpen(false);
  }

  function openProjectBundle(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
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
        await requestAlert({
          title: "Import Failed",
          description: error instanceof Error ? error.message : "Could not open project file.",
          icon: "alert",
          variant: "danger",
        });
      }
    };

    reader.readAsText(file);
  }

  async function logoutGitHub() {
    await fetch("/api/github/logout", {
      method: "POST",
    });
    setGithubUser(null);
    setRepos([]);
    setSelectedRepo(null);
  }

  const repoButtonLabel = selectedRepo
    ? selectedRepo.name
    : "Connect Repo";

  async function createRepo() {
    const res = await requestInput({
      title: "Create Repository",
      description: "Enter a name for your new GitHub repository.",
      icon: "repo",
      placeholder: "e.g. my-awesome-website",
      showCheckbox: true,
      checkboxLabel: "Make this repository private",
      defaultCheckboxValue: false,
      confirmText: "Create Repository",
    });

    if (!res.confirmed || !res.text) return;

    await runGitHubAction("Creating repo...", async () => {
      const response = await fetch("/api/github/repos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: res.text,
          private: res.checkbox,
          files,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create repo.");
      }

      setSelectedRepo(data.repo);
      setLastCommittedFiles(files);
      await refreshRepos();
      await requestAlert({
        title: "Repository Created!",
        description: `Successfully created and selected ${data.repo.fullName} as working repository.`,
        icon: "success",
        variant: "success",
      });
    });
  }

  async function commitChanges() {
    if (!selectedRepo) {
      await requestAlert({
        title: "No Repository Selected",
        description: "Please select or create a GitHub repository first.",
        icon: "alert",
      });
      return;
    }

    const res = await requestInput({
      title: "Commit Changes",
      description: `Commit latest updates directly to ${selectedRepo.fullName}`,
      icon: "commit",
      placeholder: "Describe your changes...",
      defaultValue: "Update website",
      confirmText: "Commit Changes",
    });

    if (!res.confirmed) return;

    const commitMessage = res.text || "Update website";

    await runGitHubAction("Committing...", async () => {
      const response = await fetch("/api/github/commit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: selectedRepo.owner,
          repo: selectedRepo.name,
          files,
          message: commitMessage,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not commit changes.");
      }

      setLastCommittedFiles(files);
      await requestAlert({
        title: "Committed Successfully",
        description: `Committed to ${selectedRepo.fullName}: "${commitMessage}"`,
        icon: "success",
        variant: "success",
      });
    });
  }

  async function createPullRequest() {
    if (!selectedRepo) {
      await requestAlert({
        title: "No Repository Selected",
        description: "Please select or create a GitHub repository first.",
        icon: "alert",
      });
      return;
    }

    const res = await requestInput({
      title: "Create Pull Request",
      description: `Open a pull request on ${selectedRepo.fullName}`,
      icon: "pr",
      placeholder: "Pull request title...",
      defaultValue: "Update website",
      confirmText: "Create PR",
    });

    if (!res.confirmed) return;

    const title = res.text || "Update website";

    await runGitHubAction("Creating PR...", async () => {
      const response = await fetch("/api/github/pull-request", {
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create PR.");
      }

      window.open(data.htmlUrl, "_blank", "noopener,noreferrer");
    });
  }

  async function publishSite() {
    if (!selectedRepo) {
      await requestAlert({
        title: "No Repository Selected",
        description: "Please select or create a GitHub repository first.",
        icon: "alert",
      });
      return;
    }

    if (!hasUnpublishedChanges()) {
      await requestAlert({
        title: "No New Changes",
        description: "Your website is already published with the latest code. Edit your code to publish a new update.",
        icon: "info",
      });
      return;
    }

    if (hasUncommittedChanges()) {
      const shouldCommit = await requestConfirm({
        title: "Uncommitted Changes Present",
        description: "Uncommitted changes present. Would you like to commit them before publishing to GitHub Pages?",
        icon: "alert",
        confirmText: "Commit & Publish",
        cancelText: "Publish Without Committing",
      });

      if (shouldCommit) {
        const res = await requestInput({
          title: "Commit Message",
          description: "Enter a message for your commit before publishing.",
          icon: "commit",
          placeholder: "Describe your changes...",
          defaultValue: "Publish website updates",
          confirmText: "Commit & Publish",
        });

        if (!res.confirmed) return;

        const commitMessage = res.text || "Publish website updates";

        let commitFailed = false;
        setBusyAction("Committing...");
        try {
          const response = await fetch("/api/github/commit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              owner: selectedRepo.owner,
              repo: selectedRepo.name,
              files,
              message: commitMessage,
            }),
          });
          const data = await response.json();

          if (!response.ok) {
            commitFailed = true;
            throw new Error(data.error || "Could not commit changes.");
          }

          setLastCommittedFiles(files);
        } catch (error) {
          commitFailed = true;
          await requestAlert({
            title: "Commit Failed",
            description: error instanceof Error ? error.message : "Could not commit changes.",
            icon: "alert",
            variant: "danger",
          });
        } finally {
          setBusyAction(null);
        }

        if (commitFailed) return;
      }
    }

    setBusyAction("Publishing...");
    try {
      const response = await fetch("/api/github/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          owner: selectedRepo.owner,
          repo: selectedRepo.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not deploy to GitHub Pages.");
      }

      setBusyAction("Deploying Pages...");
      await pollPagesStatus(selectedRepo.owner, selectedRepo.name);

      const pagesUrl = data.pagesUrl;
      setLastPublishedFiles(files);

      const openSite = await requestConfirm({
        title: "Website Published & Live!",
        description: `Your site has been successfully built and is hosted live on GitHub Pages: ${pagesUrl}`,
        icon: "success",
        variant: "success",
        confirmText: "Open Live Site",
        cancelText: "Done",
      });

      if (openSite) {
        window.open(pagesUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      await requestAlert({
        title: "Publish Failed",
        description: error instanceof Error ? error.message : "Failed to publish site.",
        icon: "alert",
        variant: "danger",
      });
    } finally {
      setBusyAction(null);
    }
  }

  function handlePaletteAction(actionId: string) {
    if (actionId === "create_repo") {
      createRepo();
    } else if (actionId === "commit") {
      commitChanges();
    } else if (actionId === "publish") {
      publishSite();
    } else if (actionId === "generate_website") {
      if (!aiOpen) onAiToggle();
    } else if (actionId === "toggle_ai") {
      onAiToggle();
    } else if (actionId === "toggle_elements") {
      if (onElementsToggle) onElementsToggle();
    } else if (actionId === "toggle_visual") {
      onVisualEditChange(!visualEditEnabled);
    } else if (actionId === "add_file") {
      requestInput({
        title: "New File",
        description: "Enter a filename (e.g. index.html, style.css, script.js):",
        icon: "repo",
        placeholder: "filename.html",
        confirmText: "Create File",
      }).then((res) => {
        if (res.confirmed && res.text.trim()) {
          addFile(res.text.trim(), "");
        }
      });
    } else if (actionId === "upload_asset") {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement | null;
        const uploaded = target?.files;
        if (!uploaded) return;
        for (let i = 0; i < uploaded.length; i++) {
          const file = uploaded[i];
          const filename = file.name;
          const isBinary = file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/") || Boolean(file.name.match(/\.(png|jpe?g|gif|webp|ico|svg|mp3|wav|ogg|mp4|webm)$/i));
          const reader = new FileReader();
          if (isBinary && !file.type.startsWith("image/svg+xml")) {
            reader.onload = () => typeof reader.result === "string" && addFile(filename, reader.result);
            reader.readAsDataURL(file);
          } else {
            reader.onload = () => typeof reader.result === "string" && addFile(filename, reader.result);
            reader.readAsText(file);
          }
        }
      };
      input.click();
    } else if (actionId === "save_project") {
      saveProjectFolder();
    }
  }

  const isBusy = busyAction !== null;

  return (
    <>
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onRunAction={handlePaletteAction}
      />
      {githubOpen && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setGithubOpen(false)} />
          <div
            className="fixed z-[999] w-80 rounded-xl border border-zinc-800/90 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl whitespace-normal"
            style={{ top: githubPos.top, right: githubPos.right }}
          >
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
                  <div className="flex items-center gap-2.5">
                    <img
                      src={githubUser.avatar_url}
                      alt={githubUser.login}
                      className="h-6 w-6 rounded-full border border-zinc-700 object-cover"
                    />
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
                      repos.find((r) => r.fullName === event.target.value) || null;
                    setSelectedRepo(repo);
                  }}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 outline-none transition focus:border-zinc-600 cursor-pointer"
                >
                  <option value="" disabled>Select Repository</option>
                  {repos.map((r) => (
                    <option key={r.fullName} value={r.fullName}>
                      {r.fullName} {r.private ? "(Private)" : ""}
                    </option>
                  ))}
                </select>

                <div className="space-y-1.5 pt-1">
                  <button
                    onClick={createRepo}
                    disabled={isBusy}
                    className="flex w-full items-center justify-between rounded-lg border border-zinc-800/90 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800/90 hover:text-white disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Plus size={14} className="text-emerald-400" />
                      <span>Create New Repository</span>
                    </div>
                    {busyAction === "create_repo" && (
                      <span className="text-[10px] text-zinc-400 animate-pulse">Creating...</span>
                    )}
                  </button>

                  <button
                    onClick={commitChanges}
                    disabled={isBusy || !selectedRepo}
                    className="flex w-full items-center justify-between rounded-lg border border-zinc-800/90 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800/90 hover:text-white disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <GitPullRequest size={14} className="text-blue-400" />
                      <span>Commit & Push All Files</span>
                    </div>
                    {busyAction === "commit" && (
                      <span className="text-[10px] text-zinc-400 animate-pulse">Committing...</span>
                    )}
                  </button>

                  <button
                    onClick={publishSite}
                    disabled={isBusy || !selectedRepo}
                    className="flex w-full items-center justify-between rounded-lg border border-zinc-800/90 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800/90 hover:text-white disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Rocket size={14} className="text-pink-400" />
                      <span>Publish Live to GitHub Pages</span>
                    </div>
                    {busyAction === "publish" && (
                      <span className="text-[10px] text-zinc-400 animate-pulse">Publishing...</span>
                    )}
                  </button>
                </div>

                <div className="border-t border-zinc-800/80 pt-2 text-center">
                  <button
                    onClick={logoutGitHub}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"
                  >
                    <LogOut size={14} />
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {projectOpen && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setProjectOpen(false)} />
          <div
            ref={projectRef}
            className="fixed z-[999] w-64 rounded-lg border border-zinc-800 bg-zinc-950 py-1 shadow-xl whitespace-normal"
            style={{ top: projectPos.top, left: projectPos.left }}
          >
            <button
              onClick={() => { importRef.current?.click(); setProjectOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              <FolderOpen size={16} />
              Open Project...
            </button>
            <button
              onClick={() => { saveProjectFolder(); setProjectOpen(false); }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              <Download size={16} />
              Save Project As...
            </button>
          </div>
        </>
      )}

      <CustomModal
        modal={modalState}
        onClose={() => setModalState(null)}
      />

      <div className="sleek-panel relative z-40 flex h-12 items-center overflow-x-auto no-scrollbar whitespace-nowrap border-b px-4 text-white">

      {/* Brand Logo */}
      <button
        onClick={onReplayIntro}
        className="mr-4 flex items-center gap-1.5 text-sm font-bold tracking-wide text-zinc-100 hover:text-cyan-300 transition shrink-0 group cursor-pointer"
        title="Replay Cinematic Intro"
      >
        <Sparkles size={14} className="text-amber-400 opacity-80 group-hover:scale-110 transition-transform" />
        <span>Codraw</span>
      </button>

      {/* Project Dropdown Button */}
      <div className="shrink-0">
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={openProjectBundle}
        />

        <button
          ref={(el) => { projectBtnRef.current = el; }}
          onClick={(e) => {
            e.stopPropagation();
            if (projectBtnRef.current) {
              const rect = projectBtnRef.current.getBoundingClientRect();
              setProjectPos({ top: rect.bottom + 6, left: rect.left });
            }
            setProjectOpen((v) => !v);
          }}
          className="sleek-button flex h-8 items-center gap-2 rounded border px-3 text-xs font-semibold"
        >
          Project
          <ChevronDown size={14} />
        </button>
      </div>

      {/* AI & Elements Buttons (Immediately to the right of Project button) */}
      <div className="ml-2 flex items-center gap-1.5 shrink-0">
        <button
          aria-pressed={aiOpen}
          onClick={onAiToggle}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-all ${
            aiOpen
              ? "border-sky-500/50 bg-sky-500/15 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]"
              : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-white"
          }`}
          title="Toggle AI Assistant"
        >
          <Sparkles size={13} className={aiOpen ? "text-sky-400" : "text-zinc-400"} />
          <span>AI</span>
        </button>

        <button
          aria-pressed={elementsOpen}
          onClick={onElementsToggle}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-all ${
            elementsOpen
              ? "border-sky-500/50 bg-sky-500/15 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]"
              : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-white"
          }`}
          title="Toggle Elements Library"
        >
          <Boxes size={13} className={elementsOpen ? "text-sky-400" : "text-zinc-400"} />
          <span>Elements</span>
        </button>

        <div className="mx-1.5 h-5 w-px bg-zinc-800" />

        {/* Undo & Redo buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`sleek-button grid h-8 w-8 place-items-center rounded border transition ${
              !canUndo ? "opacity-30 cursor-not-allowed" : "text-zinc-200 hover:text-white"
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            className={`sleek-button grid h-8 w-8 place-items-center rounded border transition ${
              !canRedo ? "opacity-30 cursor-not-allowed" : "text-zinc-200 hover:text-white"
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Visual Edit Button */}
        <button
          aria-pressed={visualEditEnabled}
          onClick={() => onVisualEditChange(!visualEditEnabled)}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-all ${
            visualEditEnabled
              ? "border-sky-500/50 bg-sky-500/15 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]"
              : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:text-white"
          }`}
          title="Toggle Visual Edit Mode"
        >
          <MousePointer2 size={14} className={visualEditEnabled ? "text-sky-400 animate-pulse" : "text-zinc-400"} />
          <span>Visual Edit</span>
        </button>
      </div>

      {/* Centered Command Palette Button (Aligned to Live Canvas Center) */}
      <div className="flex flex-1 justify-center pr-10 md:pr-28 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCommandPaletteOpen(true);
          }}
          className="sleek-button flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 px-3 text-xs text-zinc-300 hover:border-zinc-700"
          title="Command Palette (Ctrl+K / Cmd+K)"
        >
          <Command size={13} className="text-purple-400" />
          <span className="text-zinc-300 font-medium">Commands</span>
          <kbd className="ml-1 rounded bg-zinc-800 px-1 py-0.5 font-mono text-[10px] text-zinc-400 border border-zinc-700 hidden sm:inline-block">⌘K</kbd>
        </button>
      </div>

      {/* Right Controls: Git, GitHub, Publish */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Git Status Indicator Badge */}
        {selectedRepo && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-400 font-semibold">{selectedRepo.defaultBranch || "main"}</span>
            {hasUncommittedChanges() ? (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>● Modified</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>✓ Up to date</span>
              </span>
            )}
          </div>
        )}

        <div>
          <button
            ref={(el) => { githubBtnRef.current = el; }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (githubBtnRef.current) {
                const rect = githubBtnRef.current.getBoundingClientRect();
                setGithubPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
              }
              setGithubOpen((v) => !v);
            }}
            className="flex h-8 items-center gap-2 rounded-md border border-zinc-700/60 bg-zinc-900/80 px-3 text-xs font-medium text-zinc-200 shadow-sm backdrop-blur-md transition-all hover:border-zinc-500 hover:bg-zinc-800/90 active:scale-[0.98]"
          >
            <GitBranch size={14} className="text-zinc-400" />
            <span>{repoButtonLabel}</span>
            <ChevronDown size={13} className="text-zinc-400" />
          </button>
        </div>

        <button
          disabled={!selectedRepo || !hasUnpublishedChanges() || isBusy}
          onClick={publishSite}
          title={
            !selectedRepo
              ? "Select or create a repo first"
              : !hasUnpublishedChanges()
              ? "No new changes to publish"
              : "Publish site to GitHub Pages"
          }
          className="flex h-8 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {isBusy && (busyAction?.includes("Publish") || busyAction?.includes("Deploy") || busyAction?.includes("Commit")) ? (
            <>
              <svg className="h-4 w-4 animate-spin text-black" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" />
              </svg>
              <span>{busyAction}</span>
            </>
          ) : (
            <>
              <Rocket size={15} />
              <span>Publish</span>
            </>
          )}
        </button>
      </div>

      {/* CustomModal rendered outside toolbar above */}
    </div>
  </>
  );
}
