import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@fluentui/react-components";
import { Github } from "lucide-react";
import {
  ClerkLoading,
  GoogleOneTap,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

interface NavigationProps extends React.HTMLAttributes<HTMLDivElement> {}

const Navigation = ({ className, ...props }: NavigationProps) => {
  return (
    <>
      <div
        className={cn(
          "w-full flex justify-between items-center gap-2",
          className,
        )}
        {...props}
      >
        <div>
          <Link href="https://github.com/AwaitQuality/windowsonarm">
            <Button icon={<Github size={20} color={"#ADADAD"} />}>
              Contribute on Github
            </Button>
          </Link>
        </div>
        <ClerkLoading>
          <Button disabled>Loading...</Button>
        </ClerkLoading>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <Link href="/auth/signin">
            <Button>Sign in</Button>
          </Link>
        </SignedOut>
      </div>
      <GoogleOneTap />
    </>
  );
};

export default Navigation;
