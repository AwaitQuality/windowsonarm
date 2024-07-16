-- CreateTable
CREATE TABLE "Status" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Status" ("id", "name", "color", "text", "icon") VALUES (0, 'Native', '#10b981', 'Yes, natively supported', 'CheckmarkRegular');
INSERT INTO "Status" ("id", "name", "color", "text", "icon") VALUES (1, 'Emulated', '#3b82f6', 'Yes, supported through Prism Emulation', 'DismissRegular');
INSERT INTO "Status" ("id", "name", "color", "text", "icon") VALUES (2, 'Not Supported', '#ef4444', 'No, doesn''t work on ARM', 'SubtractSquareRegular');
INSERT INTO "Status" ("id", "name", "color", "text", "icon") VALUES (3, 'Testing...', '#f59e0b', 'App is being tested', 'OpenRegular');

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_status_fkey" FOREIGN KEY ("status") REFERENCES "Status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
