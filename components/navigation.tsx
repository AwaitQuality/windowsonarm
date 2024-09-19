import React from "react";
import { cn } from "@/lib/utils";
import { Button, Link as FluentLink, Menu, MenuTrigger, MenuList, MenuItem, MenuPopover } from "@fluentui/react-components";
import { Coffee, Github, Menu as MenuIcon } from "lucide-react";
import {
  ClerkLoading,
  GoogleOneTap,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { SiDiscord } from "@icons-pack/react-simple-icons";

interface NavigationProps extends React.HTMLAttributes<HTMLDivElement> {}

const Navigation = ({ className, ...props }: NavigationProps) => {
  return (
    <>
      <div
        className={cn(
          "w-full flex justify-between items-center gap-2 p-4",
          className,
        )}
        {...props}
      >
        <div className={"flex gap-2 flex-wrap"}>
          <Link href="https://github.com/AwaitQuality/windowsonarm">
            <Button icon={<Github size={20} color={"#ADADAD"} />}>
              Contribute on Github
            </Button>
          </Link>
          <Link href="https://github.com/sponsors/OpenSource03" className="hidden sm:inline-block">
            <Button icon={<Coffee size={20} color={"#ADADAD"} />}>
              Buy us a coffee
            </Button>
          </Link>
        </div>
        <div className={"flex gap-4 items-center"}>
          <div className="hidden sm:flex text-xs space-x-2 mr-4">
            <Link href="/privacy-policy" passHref>
              <FluentLink>Privacy Policy</FluentLink>
            </Link>
            <Link href="/terms-of-service" passHref>
              <FluentLink>Terms of Service</FluentLink>
            </Link>
          </div>
          <Link href={"https://discord.gg/8EVWtctVEk"} className="hidden sm:inline-block">
            <SiDiscord />
          </Link>
          <ClerkLoading>
            <Button disabled>Loading...</Button>
          </ClerkLoading>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Link href="/auth/signin" className="hidden sm:inline-block">
              <Button>Sign in</Button>
            </Link>
          </SignedOut>
          <div className="sm:hidden"> {/* This div wraps the Menu component */}
            <Menu positioning="below-end">
              <MenuTrigger disableButtonEnhancement>
                <Button icon={<MenuIcon />} />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem>
                    <Link href="https://github.com/sponsors/OpenSource03">
                      Buy us a coffee
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link href="/privacy-policy">Privacy Policy</Link>
                  </MenuItem>
                  <MenuItem>
                    <Link href="/terms-of-service">Terms of Service</Link>
                  </MenuItem>
                  <MenuItem>
                    <Link href={"https://discord.gg/8EVWtctVEk"}>Discord</Link>
                  </MenuItem>
                  <SignedOut>
                    <MenuItem>
                      <Link href="/auth/signin">Sign in</Link>
                    </MenuItem>
                  </SignedOut>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
      </div>
      <GoogleOneTap />
    </>
  );
};

export default Navigation;
