import { ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Meta from "../meta";
import { useSession, signOut } from "next-auth/react";
import { Logo, Divider } from "@/components/shared/icons";
import ListBox from "./list-box";

const NavTabs = dynamic(() => import("./nav-tabs"), {
  ssr: false,
  loading: () => <div className="w-full h-12 -mb-0.5" />,
}); // dynamic import to avoid react hydration mismatch error

export default function AppLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  return (
    <div>
      <Meta />
      <div className="min-h-screen w-full bg-gray-50">
        <div className="sticky top-0 left-0 right-0 border-b bg-white border-gray-200 z-10">
          <div className="max-w-screen-xl mx-auto px-5 sm:px-20">
            <div className="h-10 flex justify-between items-center my-3">
              <div className="flex items-center">
                <Link href="/">
                  <a>
                    <Logo className="w-8 h-8 active:scale-95 transition-all duration-75" />
                  </a>
                </Link>
                <Divider className="h-8 w-8 ml-3 text-gray-200" />
                <ListBox />
              </div>
              <button className="rounded-full overflow-hidden border border-gray-300 w-10 h-10 flex justify-center items-center active:scale-95 focus:outline-none transition-all duration-75">
                {session && (
                  <img
                    alt={session?.user?.email || "Avatar for logged in user"}
                    src={`https://avatars.dicebear.com/api/micah/${session?.user?.email}.svg`}
                  />
                )}
              </button>
            </div>
            <NavTabs />
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto px-5 sm:px-20">{children}</div>
      </div>
    </div>
  );
}
