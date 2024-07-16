import { Container } from "@/components/ui/container";
import {
  Body1,
  Button,
  Caption1,
  Card,
  CardFooter,
  CardHeader,
  Display,
  Divider,
  InfoLabel,
  LargeTitle,
  Link as FluentLink,
  makeStyles,
  shorthands,
  Subtitle1,
  Tag,
  tokens,
} from "@fluentui/react-components";
import dayjs from "dayjs";
import { ArrowReplyRegular, LinkRegular } from "@fluentui/react-icons";
import Modal from "react-modal";
import React from "react";
import ShareButton from "@/components/share-button";
import Link from "next/link";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import Markdown from "react-markdown";

interface SelectedAppModalProps {
  selectedApp: FullPost | null;
  open: boolean;
  closeModal: () => void;
}

const useStyles = makeStyles({
  titleText: {
    fontSize: tokens.fontSizeHero800,
    textAlign: "center",
    lineHeight: tokens.lineHeightBase600,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding("16px"),
    "@media (min-width: 768px)": {
      fontSize: tokens.fontSizeHero1000,
      lineHeight: tokens.lineHeightHero900,
    },
  },
  subtitleText: {
    fontSize: tokens.fontSizeBase500,
    textAlign: "center",
    lineHeight: tokens.lineHeightBase300,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding("16px"),
    "@media (min-width: 768px)": {
      fontSize: tokens.fontSizeHero800,
      lineHeight: tokens.lineHeightHero800,
    },
  },
  cardAppTitle: {
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightBase600,
    fontWeight: tokens.fontWeightSemibold,
    "@media (min-width: 768px)": {
      fontSize: tokens.fontSizeHero900,
      lineHeight: tokens.lineHeightHero900,
    },
  },
  footer: {
    flexDirection: "column",
    "@media (min-width: 768px)": {
      flexDirection: "row",
    },
  },
});

const SelectedAppModal = ({
  open,
  selectedApp,
  closeModal,
}: SelectedAppModalProps) => {
  const [expanded, setExpanded] = React.useState(false);

  const classes = useStyles();

  if (!selectedApp) return null;

  return (
    <Modal
      isOpen={open}
      onRequestClose={closeModal}
      contentLabel="Selected App Modal"
      className={"p-4 justify-center text-accent overflow-auto max-h-full"}
      shouldFocusAfterRender={false}
      parentSelector={() => document.getElementById("#app") as HTMLElement}
      overlayClassName={
        "fixed inset-0 flex bg-black/50 justify-center items-center backdrop-blur-md"
      }
    >
      <Container>
        <div className={"flex flex-col items-center mb-4"}>
          <Display className={classes.titleText}>
            Is <span className={"text-blue-400"}>{selectedApp.title}</span> ARM
            ready?
          </Display>
          <LargeTitle className={classes.subtitleText}>
            {selectedApp.statusRel?.text}
          </LargeTitle>
        </div>
        <Card className={"w-full"} appearance={"filled-alternative"}>
          <CardHeader
            header={
              <LargeTitle className={classes.cardAppTitle}>
                {selectedApp.title}
              </LargeTitle>
            }
            description={
              <Caption1>
                {dayjs(selectedApp.updated_at).format("YYYY-MM-DD")} by{" "}
                {selectedApp.user?.username || "Anonymous"}
              </Caption1>
            }
          />

          <span className={"mt-2"}>
            <Markdown
              components={{
                h1: ({ children }) => <LargeTitle>{children}</LargeTitle>,
                h2: ({ children }) => <Subtitle1>{children}</Subtitle1>,
                h3: ({ children }) => <Caption1>{children}</Caption1>,
                p: ({ children }) => <Body1>{children}</Body1>,
                a: ({ children, href }) => (
                  <FluentLink href={href}>{children}</FluentLink>
                ),
              }}
            >
              {selectedApp.description.slice(0, 820) +
                (selectedApp.description.length > 820 && !expanded
                  ? "..."
                  : "")}
            </Markdown>
            {expanded && (
              <Markdown
                components={{
                  h1: ({ children }) => <LargeTitle>{children}</LargeTitle>,
                  h2: ({ children }) => <Subtitle1>{children}</Subtitle1>,
                  h3: ({ children }) => <Caption1>{children}</Caption1>,
                  p: ({ children }) => <Body1>{children}</Body1>,
                  a: ({ children, href }) => (
                    <FluentLink href={href}>{children}</FluentLink>
                  ),
                }}
              >
                {selectedApp.description.slice(500)}
              </Markdown>
            )}
            {selectedApp.description.length > 500 && (
              <div className={"mt-2"}>
                {expanded ? (
                  <FluentLink onClick={() => setExpanded(false)}>
                    Show less
                  </FluentLink>
                ) : (
                  <FluentLink onClick={() => setExpanded(true)}>
                    Show more
                  </FluentLink>
                )}
              </div>
            )}
          </span>

          <Divider className={"my-2"} />

          {selectedApp.tags.length && selectedApp.tags.length > 0 && (
            <div
              className={
                "flex items-center flex-row gap-2 mb-2 overflow-y-auto"
              }
            >
              <Subtitle1>Tags:</Subtitle1>
              {selectedApp.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}

          <CardFooter className={classes.footer}>
            {selectedApp.app_url && (
              <Link href={selectedApp.app_url}>
                <Button
                  icon={<LinkRegular fontSize={16} />}
                  appearance="primary"
                  className={"w-full md:w-auto"}
                >
                  Visit website
                </Button>
              </Link>
            )}
            {selectedApp.community_url && (
              <InfoLabel
                info={
                  <>
                    This project is not compatible with ARM by default, but the
                    community has made it work. This link will take you to the
                    community project.
                  </>
                }
              >
                <Link href={selectedApp.community_url}>
                  <Button
                    icon={<LinkRegular fontSize={16} />}
                    appearance="primary"
                    color={"danger"}
                    className={"w-full md:w-auto"}
                  >
                    Community project
                  </Button>
                </Link>
              </InfoLabel>
            )}
            <InfoLabel
              info={
                <>
                  We&apos;re working on a on-site report feature, but until
                  it&apos;s ready, we would suggest using Github issues for this
                  purpose.
                </>
              }
            >
              <Link
                href={"https://github.com/AwaitQuality/windowsonarm/issues"}
              >
                <Button
                  className={"w-11/12 md:w-auto"}
                  icon={<ArrowReplyRegular fontSize={16} />}
                >
                  Report issue
                </Button>
              </Link>
            </InfoLabel>
            <ShareButton />
            <Button
              appearance="secondary"
              className={"w-full md:w-auto"}
              onClick={closeModal}
            >
              Close
            </Button>
          </CardFooter>
        </Card>
      </Container>
    </Modal>
  );
};

export default SelectedAppModal;
