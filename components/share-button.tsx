import {
  Body1,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Divider,
} from "@fluentui/react-components";
import React from "react";
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  RedditIcon,
  RedditShareButton,
  TelegramIcon,
  TelegramShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";
import { ShareRegular } from "@fluentui/react-icons";

interface ShareModalProps {
  open: boolean;
  onClose?: () => void;
}

const ShareButton = () => {
  return (
    <>
      <Dialog>
        <DialogTrigger disableButtonEnhancement>
          <Button icon={<ShareRegular />}>Share</Button>
        </DialogTrigger>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Share this page</DialogTitle>
            <DialogContent className={"flex gap-4 flex-col"}>
              <Body1 className={"mt-2"}>
                Use the share buttons below to share this page with your friends
                and family.
              </Body1>

              <Divider />

              <div className={"flex gap-4 justify-center"}>
                <EmailShareButton
                  url={"https://windowsonarm.org/"}
                  subject={"Want to learn which apps are ARM ready?"}
                  body={
                    "Check out this website to learn more about which apps are ARM ready!"
                  }
                >
                  <EmailIcon />
                </EmailShareButton>

                <LinkedinShareButton
                  url={"https://windowsonarm.org/"}
                  title={"Want to learn which apps are ARM ready?"}
                  summary={
                    "Check out this website to learn more about which apps are ARM ready!"
                  }
                  source={"https://windowsonarm.org"}
                >
                  <LinkedinIcon />
                </LinkedinShareButton>

                <TelegramShareButton
                  url={"https://windowsonarm.org/"}
                  title={
                    "Want to learn which apps are ARM ready? Check this out!"
                  }
                >
                  <TelegramIcon />
                </TelegramShareButton>

                <RedditShareButton
                  url={"https://windowsonarm.org/"}
                  title={"Check this page to learn which apps are ARM ready!"}
                >
                  <RedditIcon />
                </RedditShareButton>

                <WhatsappShareButton
                  url={"https://windowsonarm.org/"}
                  title={"Check this page to learn which apps are ARM ready!"}
                >
                  <WhatsappIcon />
                </WhatsappShareButton>

                <FacebookShareButton
                  url={"https://windowsonarm.org/"}
                  hashtag={"#WindowsOnArm"}
                >
                  <FacebookIcon />
                </FacebookShareButton>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default ShareButton;
