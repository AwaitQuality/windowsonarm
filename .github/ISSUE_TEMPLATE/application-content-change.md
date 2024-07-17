name: Application content change
description: Is your data different from ours? If so, please describe the differences so we can update it accordingly.
title: "Content Change To Application [ NAME ] needed."
labels: ["invalid"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        If you don't want to change the data of a field, leave it blank.

        I want you to update, content of application [ NAME ]

  - type: input
    id: application-name
    attributes:
      label: Application Name
      description: Enter the name of the application
      placeholder: ex. My Application
    validations:
      required: true

  - type: input
    id: category-id
    attributes:
      label: Category ID
      description: Enter the category ID of the application
      placeholder: ex. 123
    validations:
      required: true

  - type: input
    id: company
    attributes:
      label: Company
      description: Enter the company name
      placeholder: ex. My Company
    validations:
      required: true

  - type: input
    id: app-url
    attributes:
      label: App URL
      description: Enter the URL of the application
      placeholder: ex. https://example.com
    validations:
      required: true

  - type: input
    id: icon-url
    attributes:
      label: Icon URL
      description: Enter the URL of the application icon
      placeholder: ex. https://example.com/icon.png
    validations:
      required: true

  - type: input
    id: tags
    attributes:
      label: Tags
      description: Enter tags for the application, separated by commas
      placeholder: ex. tag1, tag2, tag3
    validations:
      required: false

  - type: textarea
    id: description
    attributes:
      label: Description
      description: Enter a description for the application
      placeholder: ex. This application is used for...
    validations:
      required: true
