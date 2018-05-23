### Managing the EuPathDB Website Privacy Policy

The EuPathDB Website Privacy Policy is served at the url,
[https://eupathdb.org/documents/EuPathDB_Website_Privacy_Policy.shtml](https://eupathdb.org/documents/EuPathDB_Website_Privacy_Policy.shtml)

The source file is the Markdown-formated file,
[`EbrcWebsiteCommon/Site/htdocs/documents/EuPathDB_Website_Privacy_Policy.md`](https://cbilsvn.pmacs.upenn.edu/svn/apidb/EbrcWebsiteCommon/trunk/Site/htdocs/documents/EuPathDB_Website_Privacy_Policy.md).

This Markdown file is converted to the HTML formated file,
[`EbrcWebsiteCommon/Site/htdocs/documents/EuPathDB_Website_Privacy_Policy.shtml`](https://cbilsvn.pmacs.upenn.edu/svn/apidb/EbrcWebsiteCommon/trunk/Site/htdocs/documents/EuPathDB_Website_Privacy_Policy.shtml),
using the `pandoc` command.

```
$ pandoc EuPathDB_Website_Privacy_Policy.md  -o EuPathDB_Website_Privacy_Policy.shtml
```

Both files are committed to the svn repo.

The use of the separate Markdown-formated file is simply for editing
convenience. If the designated maintainers of the Policy prefer to work
directly in HTML, they can choose to remove the Markdown file from the
repository and only maintain the HTML file.

Alternatively, both files can be replaced with any other suitable
delivery method (WDK XML record) or location (outreach's external
documentation site). There's nothing special about the format or host
location.

If you do change location of the file, be sure to update links to it on
our Facebook, Twitter and Globus Galaxy pages.
