import { Button } from "@/components/ui/button";
import { useThemeStore } from "../hooks/useTheme";
import clsx from "clsx";
import { Moon, Sun } from "lucide-react";

export interface ThemeToggleTypes {
  /**
   * This prop is used to determine if the button should be labeled or not.
   * If true, the button will display a label next to the icon.
   * If false, only the icon will be displayed.
   * @default false
   * @type {boolean}
   */
  showLabel?: boolean;

  /**
   * This prop is used to apply additional CSS classes to the button.
   * It allows for customization of the button's appearance.
   * @default ""
   * @type {string}
   */
  className?: string;

  /**
   * This prop is used to set the size of the icon in the button.
   * It allows for customization of the icon's size.
   * @default 1
   * @type {number}
   */
  size?: number;
}

const ThemeToggleButton: React.FC<ThemeToggleTypes> = (props) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Button
      size={"icon"}
      variant={"outline"}
      onClick={toggleTheme}
      type="button"
      className={clsx(
        "px-2 py-2 border-[1px] border-support-100/30 text-support-100 flex items-center ",
        props.className
      )}
    >
      {theme === "dark" ? <Sun /> : <Moon />}

      <span className={clsx(props.showLabel ? "ml-2" : "hidden")}>
        {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      </span>
    </Button>
  );
};

export default ThemeToggleButton;