import { Sprite } from "./Pixel";

const Footer = () => (
  <footer className="border-t-4 border-zinc-900">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 font-pixel text-lg text-zinc-500 sm:flex-row sm:px-6">
      <span className="flex items-center gap-2">
        <Sprite name="maya" size={16} />
        <Sprite name="theo" size={16} />
        TandemCode, {new Date().getFullYear()}. Made by Naman Rusia.
      </span>
      <a href="https://github.com/naman0r/tandemcode" className="hover:text-zinc-100">
        Source on GitHub
      </a>
    </div>
  </footer>
);

export default Footer;
