import { cn } from "@dub/utils";
import { cva } from "class-variance-authority";
import { PropsWithChildren, createContext, useContext, useState } from "react";
import { CardListContext } from "./card-list";

const cardListCardVariants = cva("w-full group/card border-gray-200 bg-white", {
  variants: {
    variant: {
      compact:
        "first-of-type:rounded-t-xl last-of-type:rounded-b-xl first-of-type:border-t border-b border-x hover:bg-gray-50 transition-colors",
      loose:
        "border rounded-xl transition-[filter] hover:[filter:drop-shadow(0_8px_12px_#222A350d)_drop-shadow(0_32px_80px_#2f30370f)]",
    },
  },
});

const cardListCardInnerClassName = "w-full py-2.5 px-4";

export const CardContext = createContext<{
  hovered: boolean;
}>({ hovered: false });

export function CardListCard({
  outerClassName,
  innerClassName,
  children,
  onClick,
}: PropsWithChildren<{
  outerClassName?: string;
  innerClassName?: string;
  onClick?: () => void;
}>) {
  const { variant } = useContext(CardListContext);

  const [hovered, setHovered] = useState(false);

  return (
    <li
      className={cn(cardListCardVariants({ variant }), outerClassName)}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div
        className={cn(cardListCardInnerClassName, innerClassName)}
        onClick={
          onClick
            ? (e) => {
                const existingModalBackdrop =
                  document.getElementById("modal-backdrop");

                // Don't trigger onClick if there's already an open modal
                if (existingModalBackdrop) {
                  return;
                }

                // Traverse up the DOM tree to see if there's a clickable element between this card and the click
                for (
                  let target = e.target as HTMLElement, i = 0;
                  target && target !== e.currentTarget && i < 100; // Only go 100 levels deep
                  target = target.parentElement as HTMLElement, i++
                ) {
                  // Don't trigger onClick if a clickable element inside the card was clicked
                  if (
                    ["button", "a", "input", "textarea"].includes(
                      target.tagName.toLowerCase(),
                    )
                  )
                    return;
                }

                onClick();
              }
            : undefined
        }
      >
        <CardContext.Provider value={{ hovered }}>
          {children}
        </CardContext.Provider>
      </div>
    </li>
  );
}
