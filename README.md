# Asana Batch

Unofficial [Google Chrome](https://chrome.google.com/webstore/detail/asana-batch/hiokcebclngojlhmjojefhgoakokeijm) and [Firefox]() extension to enable batch actions on [Asana](https://asana.com/)

## Feature list as well as to-do list

- [x] Copy collaborators from a task
- [ ] Add/edit/delete groups of people
- [ ] Add subtasks for groups of people
- [ ] Export/import groups of people


## Usage

Chrome:
- Install it from the [Chrome Web Store](https://chrome.google.com/webstore/detail/asana-batch/hiokcebclngojlhmjojefhgoakokeijm)
- You can also `git clone` this repository (or download the repository as a zip file) and load the folder to Google Chrome to install it as a developer

Firefox:
- ~~Install it from the [Firefox AMO store]()~~ (coming soon)
- ~~Asana Navigator doesn't work with Firefox if added as a temporary add-on, because of the limitation of `chrome.storage.sync`~~ (coming soon)

Common:
- The features are automatically enabled when you are on an Asana task page
- This extension doesn't work in incognito mode, because it can't interact with Asana API

## Privacy policy and terms of use

We don't collect your data. We don't have our server to store, use, and share such information. We only use your Asana data (URLs, resource IDs, names, task description, etc.) to make API calls to Asana through HTTPS. All communications are between you and Asana API. All options are saved to your browser, not in other places.

The extension requires the following permissions:

- `activeTab` permission is needed to get the task gid from the URL
- `declarativeContent` permission is needed to be active on web pages with specific URLs (Asana web app)
- ~~`storage` permission is needed to save your options to the browser~~ (coming soon)
- ~~`tabs` permission is needed to be compatible with Firefox. The extension doesn't work as expected with only activeTab permission~~ (coming soon)

I try my best to maintain the quality and safety of this extension, but please use it at your own risk. The author doesn't take any responsibility for any damage caused by use of this extension.

## Feedback and contribution

I'd love to hear from users and developers.
Please feel free to post feature requests, bug reports, and questions through [GitHub Issues](https://github.com/ShunSakurai/asana-batch/issues), [Chrome Web Store](https://chrome.google.com/webstore/detail/asana-batch/hiokcebclngojlhmjojefhgoakokeijm), ~~[addons.mozilla.org](), or [Asana Community Forum]()~~. I'd also welcome pull requests.

## License

[MIT License](https://github.com/ShunSakurai/asana-batch/blob/master/LICENSE)
