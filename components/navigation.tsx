"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Button,
  Link as FluentLink,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
} from "@fluentui/react-components";
import { Coffee, Github, Menu as MenuIcon, Home } from "lucide-react";
import {
  ClerkLoading,
  GoogleOneTap,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { ChartMultipleRegular } from "@fluentui/react-icons";

interface NavigationProps extends React.HTMLAttributes<HTMLDivElement> {}

const Navigation = ({ className, ...props }: NavigationProps) => {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <>
      <div
        className={cn(
          "w-full flex justify-between items-center gap-2",
          className
        )}
        {...props}
      >
        <div className="sm:hidden">
          <Menu positioning="below-start">
            <MenuTrigger disableButtonEnhancement>
              <Button icon={<MenuIcon />} />
            </MenuTrigger>
            <MenuPopover>
              <MenuList className="w-64">
                <MenuItem>
                  <Link href="/" className="w-full">
                    <div className="flex items-center gap-2 w-full">
                      <Home size={16} />
                      <span>Home</span>
                    </div>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="/statistics" className="w-full">
                    <div className="flex items-center gap-2 w-full">
                      <ChartMultipleRegular />
                      <span>Statistics</span>
                    </div>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="https://github.com/AwaitQuality/windowsonarm" className="w-full">
                    <div className="flex items-center gap-2 w-full">
                      <Github size={16} />
                      <span>Contribute on Github</span>
                    </div>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="https://github.com/sponsors/OpenSource03" className="w-full">
                    <div className="flex items-center gap-2 w-full">
                      <Coffee size={16} />
                      <span>Buy us a coffee</span>
                    </div>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="/privacy-policy" className="w-full">
                    <div className="flex items-center gap-2 w-full">
                      <span>Privacy Policy</span>
                    </div>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="/terms-of-service" className="w-full">
                    <div className="flex items-center gap-2 w-full">
                      <span>Terms of Service</span>
                    </div>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="https://discord.gg/8EVWtctVEk" className="w-full">
                    <div className="flex items-center gap-2 w-full">
                      <SiDiscord className="w-4 h-4" />
                      <span>Discord</span>
                    </div>
                  </Link>
                </MenuItem>
                {isLoaded && !isSignedIn && (
                  <MenuItem>
                    <Link href="/auth/signin" className="w-full">
                      <div className="flex items-center gap-2 w-full">
                        <span>Sign in</span>
                      </div>
                    </Link>
                  </MenuItem>
                )}
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
        <div className={"hidden sm:flex gap-2 flex-wrap"}>
          <Link href="/" passHref>
            <Button
              icon={<Home size={20} />}
              appearance={pathname === "/" ? "primary" : "secondary"}
            >
              Home
            </Button>
          </Link>
          <Link href="/statistics" passHref>
            <Button
              icon={<ChartMultipleRegular />}
              appearance={pathname === "/statistics" ? "primary" : "secondary"}
            >
              Statistics
            </Button>
          </Link>
          <Link href="https://github.com/AwaitQuality/windowsonarm">
            <Button icon={<Github size={20} color={"#ADADAD"} />}>
              Contribute on Github
            </Button>
          </Link>
          <Link href="https://github.com/sponsors/OpenSource03">
            <Button icon={<Coffee size={20} color={"#ADADAD"} />}>
              Buy us a coffee
            </Button>
          </Link>
        </div>
        <div className={"flex gap-4 items-center ml-auto"}>
          <div className="hidden sm:flex text-xs space-x-2 mr-4">
            <Link href="/privacy-policy" passHref>
              <FluentLink>Privacy Policy</FluentLink>
            </Link>
            <Link href="/terms-of-service" passHref>
              <FluentLink>Terms of Service</FluentLink>
            </Link>
          </div>
          <Link
            href={"https://discord.gg/8EVWtctVEk"}
            className="hidden sm:inline-block"
          >
            <SiDiscord />
          </Link>
          <ClerkLoading>
            <Button disabled>Loading...</Button>
          </ClerkLoading>
          {isLoaded && isSignedIn && <UserButton />}
          {isLoaded && !isSignedIn && (
            <Link href="/auth/signin" className="hidden sm:inline-block">
              <Button>Sign in</Button>
            </Link>
          )}
        </div>
      </div>
      <GoogleOneTap />
    </>
  );
};

export default Navigation;
