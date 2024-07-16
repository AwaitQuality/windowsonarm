import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@fluentui/react-components";
import { Github } from "lucide-react";
import {
  ClerkLoading,
  GoogleOneTap,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";

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
          <Button icon={<Github size={20} color={"#ADADAD"} />}>
            Contribute on Github
          </Button>
        </div>
        <ClerkLoading>
          <Button disabled>Loading...</Button>
        </ClerkLoading>
        <SignedIn>
          {/* Mount the UserButton component */}
          <UserButton />
        </SignedIn>
        <SignedOut>
          {/* Signed out users get sign in button */}
          <Button>
            <SignInButton />
          </Button>
        </SignedOut>
      </div>
      <GoogleOneTap />
    </>
  );
};

export default Navigation;
