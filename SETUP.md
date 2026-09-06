# SETUP

How to add the real content. The website reads everything from two data files
and two folders. No database. No uploads.

## Where to put the documents

Put the PDF files in the folder `public/documents/`. Use these exact file names:

| File name | Document |
|---|---|
| `field-guide.pdf` | Baghewala field guide |
| `technical-reference.pdf` | Merged technical reference |
| `research.pdf` | Full research document |
| `presentation.pdf` | Project presentation |

The website reads the file names from `src/lib/data/documents.ts`. Change that
file if you use a different name.

Update the `fileSize` value in `src/lib/data/documents.ts` after you add each
file. A document with no file shows a card in a disabled state with the text
"File not added yet."

## Where to put the team photos

Put the photos in the folder `public/team/`. Use these exact file names:

| File name | Member |
|---|---|
| `1.jpg` | Member 1 |
| `2.jpg` | Member 2 |
| `3.jpg` | Member 3 |
| `4.jpg` | Member 4 |
| `5.jpg` | Member 5 |
| `6.jpg` | Member 6 |

The number in the file name sets the display order. Member 1 shows first.

Use a square image. Use 800 by 800 pixels or more. Keep each file below 500 KB.

Open `src/lib/data/team.ts`. Replace each name, role, description, LinkedIn URL,
and Instagram URL. Keep the `id` values from 1 to 6. A member with no photo file
shows their initials on a colored background.

## How to change the order

The `id` value sets the order on the team page and the documents page. Change
the `id` values to change the order.
