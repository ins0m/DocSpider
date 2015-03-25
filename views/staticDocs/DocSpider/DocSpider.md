[ApplicationName: DocSpider]
[ApplicationCategory: Documentation tools]
[ApplicationRepository: https://github.com/ins0m/DocSpider]

A tool for creating, copying, archiving and presenting (as well as parsing) documentation of the AgeLab.

## Static documentation creation
This tool provides a mechanism to search for all relevant documentation in the AgeLab netdrive. Files it findes are coppied to it's homefolder and are used for presentation and archiving purpose. If you see this readme through a browser chances are this tool generated it and shows the content of this file dynamicly as a html formatted text

Repositories are the locations this tool spiders for documentation. They are defined in the file "repositories.json" in the root directory of this project. Add arbitrary pathes to search in them. Only files that follow a certain naming schema and have the documentation header are parsed:

Schema:

	*README*.md or in regex: .*README.*\.md

Header:

	[ApplicationName: Documentation Generator]

Optional header elements:

	[ApplicationCategory: Toolbelt]
	[ApplicationDirectory: /Users/user/DocumentationGenerator]
	[ApplicationRepository: --- ]

Highlighting

	The category (defined in the header) artifacts is highlighted in a special way.

## What it can't handle
* File-Attachments
* Double-names - Applicationnames __need__ to be unique
