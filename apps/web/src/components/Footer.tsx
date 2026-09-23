import { Github } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-zinc-200 dark:border-zinc-800">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-xs text-zinc-500 sm:px-6 dark:text-zinc-400">
      <span>TandemCode, {new Date().getFullYear()}. Made by Naman Rusia.</span>
      <a
        href="https://github.com/naman0r/tandemcode"
        className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <Github className="h-4 w-4" />
        Source
      </a>
    </div>
  </footer>
);

export default Footer;
