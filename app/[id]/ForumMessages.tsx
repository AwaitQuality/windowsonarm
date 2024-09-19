import React, { useState } from "react";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  makeStyles,
  shorthands,
  Text,
  tokens,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Subtitle1,
  ProgressBar,
} from "@fluentui/react-components";
import { useDiscordForum } from "@/lib/hooks/useDiscordForum";
import GlobalMarkdown from "@/components/markdown";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import {
  DismissRegular,
  ArrowJoinRegular,
  SendRegular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  messageContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  messageCard: {
    ...shorthands.overflow("hidden"),
  },
  messageContent: {
    padding: tokens.spacingHorizontalM,
    "& p": {
      margin: 0,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    "& a": {
      color: tokens.colorBrandBackground,
      textDecoration: "none",
      "&:hover": {
        textDecoration: "underline",
      },
    },
  },
  replyButton: {
    marginTop: tokens.spacingVerticalM,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackgroundHover,
    },
  },
  dialogButton: {
    minWidth: "120px", // Adjust this value as needed
    whiteSpace: "nowrap",
  },
});

interface ForumMessagesProps {
  postId: string;
}

export default function ForumMessages({ postId }: ForumMessagesProps) {
  const classes = useStyles();
  const { messages, loading, error, discordUrl } = useDiscordForum(postId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleJoinDiscord = () => {
    window.open("https://discord.gg/8EVWtctVEk", "_blank");
  };

  const handleReplyClick = () => {
    if (discordUrl) {
      window.open(discordUrl, "_blank");
    }
    setIsDialogOpen(false);
  };

  if (loading) {
    return (
      <Card className="rounded-lg shadow-md p-6 mb-8" appearance={"filled-alternative"} size="large">
        <Subtitle1>Discussion</Subtitle1>
        <Text className="mb-4">Loading forum messages</Text>
        <ProgressBar />
      </Card>
    );
  }

  if (error) return <Text>Error loading forum messages: {error.message}</Text>;
  if (!messages || messages.length === 0)
    return <Text>No forum messages yet.</Text>;

  return (
    <Card
      className="rounded-lg shadow-md p-6 mb-8"
      appearance={"filled-alternative"}
      size="large"
    >
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-500/20 to-transparent opacity-70 blur-xl pointer-events-none"></div>
      <Subtitle1>Discussion</Subtitle1>
      <div className={classes.messageContainer}>
        {messages.map((message) => (
          <Card key={message.id} className={classes.messageCard}>
            <CardHeader
              image={
                <Avatar
                  image={{ src: message.author.avatar_url ?? undefined }}
                  name={message.author.username}
                  size={32}
                />
              }
              header={<Text weight="semibold">{message.author.username}</Text>}
              description={
                <Text size={200}>
                  {new Date(message.timestamp).toLocaleString()}
                </Text>
              }
            />
            <div className={classes.messageContent}>
              <GlobalMarkdown>
                {message.content.replace(/\\n/g, "<br/>")}
              </GlobalMarkdown>
            </div>
          </Card>
        ))}
        {discordUrl && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(_, data) => setIsDialogOpen(data.open)}
          >
            <DialogTrigger disableButtonEnhancement>
              <Button className={classes.replyButton} icon={<SiDiscord />}>
                Join and reply on Discord
              </Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Join Discord</DialogTitle>
                <DialogContent>
                  To reply to this thread, you need to join our Discord server
                  first. Would you like to join now?
                </DialogContent>
                <DialogActions
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                  }}
                >
                  <DialogTrigger disableButtonEnhancement>
                    <Button
                      appearance="secondary"
                      className={classes.dialogButton}
                      icon={<DismissRegular />}
                    >
                      Cancel
                    </Button>
                  </DialogTrigger>
                  <Button
                    appearance="primary"
                    className={classes.dialogButton}
                    onClick={handleJoinDiscord}
                    icon={<ArrowJoinRegular />}
                  >
                    Join Discord
                  </Button>
                  <Button
                    appearance="primary"
                    className={classes.dialogButton}
                    onClick={handleReplyClick}
                    icon={<SendRegular />}
                  >
                    Reply on Discord
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        )}
      </div>
    </Card>
  );
}
