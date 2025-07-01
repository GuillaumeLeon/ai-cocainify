// Some parts of this code are unshamely copied from
import { browser } from 'wxt/dist/browser';
// Mozilla's Bitch to Boss extension: https://addons.mozilla.org/fr/firefox/addon/b-itch-to-boss/
// and are so under MPL 2.0
import cocaine from '../lib/cocaine';

// @ts-expect-error defined at runtime for some reason (like wtf WXT)
export default defineContentScript({
    matches: ["https://*/*"],
    runAt: 'document_end',
    async main() {
        const url = new URL(window.location.href);
        if (
          url.host.includes("wikipedia.org") &&
          url.searchParams.get("action") === "edit"
        ) {
            return;
        }

        // throttling global variables
        let replaceWait = false;
        let replaceWaitTime = 250; // quarter of a second
        let replaceQueue = [];
        let cocainePackets = cocaine;

        // Join cocainePackets in a regex
        let regexString = "";
        for (let key in cocainePackets) {
            regexString += cocainePackets[key].regex + "|";
        }
        regexString = regexString.slice(0, -1); // Remove trailing pipe

        const regex = new RegExp(regexString, "gi");

        // Use case insensitive replacer
        const replacer = (match: string) => {
            const delimiter = /([\s-]+)/;
            let needleWords = match.split(delimiter);
            const haystackWords =
              cocainePackets[match.toLowerCase()].replaceWith.split(delimiter);

            // Capitalize and transform to UpperCase when needed
            for (let i = 0; i < needleWords.length; i++) {
                if (needleWords[i] === needleWords[i].toUpperCase()) {
                    // whole word in UpperCase
                    haystackWords[i] = haystackWords[i].toUpperCase();
                } else if (needleWords[i][0] === needleWords[i][0].toUpperCase()) {
                    // Capitalize
                    haystackWords[i] =
                      haystackWords[i][0].toUpperCase() + haystackWords[i].slice(1);
                }
            }

            return haystackWords.join("");
        };

        function processQueue() {
            // clone queue
            const queue = replaceQueue.slice(0);
            // empty queue
            replaceQueue = [];
            // loop through clone
            queue.forEach((mutations) => {
                replaceNodes(mutations);
            });
        }

        function setWait() {
            replaceWait = true;
            setTimeout(function () {
                replaceWait = false;
                timerCallback();
            }, replaceWaitTime);
        }

        function timerCallback() {
            if (replaceQueue.length > 0) {
                // if there are queued items, process them
                processQueue();
                // then set wait to do next batch
                setWait();
            } else {
                // if the queue has been empty for a full timer cycle
                // remove the wait time to process the next action
                replaceWait = false;
            }
        }

        // The callback used for the document body and title observers
        const observerCallback: MutationCallback = (mutations) => {
            // add to queue
            replaceQueue.push(mutations);
            if (!replaceWait) {
                processQueue();
                setWait();
            } // else the queue will be processed when the timer finishes
        };

        const replaceText = (v: string) => {
            v = v.replace(regex, replacer);
            return v;
        };
        const handleText = (textNode: Node) => {
            textNode.nodeValue = replaceText(textNode.nodeValue);
        };

        // Returns true if a node should *not* be altered in any way
        const forbiddenTagNames = [
            "meta",
            "link",
            "textarea",
            "input",
            "script",
            "noscript",
            "template",
            "style",
        ];
        function isForbiddenNode(node) {
            if (node.isContentEditable) {
                return true;
            } else if (node.parentNode && node.parentNode.isContentEditable) {
                return true;
            } else {
                return forbiddenTagNames.includes(node.tagName?.toLowerCase());
            }
        }

        // The callback used for the document body and head observers
        const replaceNodes = (mutations: MutationRecord[]) => {
            let i, node;

            mutations.forEach(function (mutation) {
                for (i = 0; i < mutation.addedNodes.length; i++) {
                    node = mutation.addedNodes[i];
                    if (isForbiddenNode(node)) {
                        // Should never operate on user-editable content
                        continue;
                    } else if (node.nodeType === 3) {
                        // Replace the text for text nodes
                        handleText(node);
                    } else {
                        // Otherwise, find text nodes within the given node and replace text
                        walk(node);
                    }
                }
            });
        };

        const walk = (rootNode: Node) => {
            // Find all the text nodes in rootNode
            let walker = document.createTreeWalker(
                rootNode,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function (node: any) {
                        return /^(STYLE|SCRIPT)$/.test(node.parentElement.tagName) ||
                        /^\s*$/.test(node.data)
                          ? NodeFilter.FILTER_REJECT
                          : NodeFilter.FILTER_ACCEPT;
                    },
                },
              ),
              node;

            // Modify each text node's value
            while ((node = walker.nextNode())) {
                handleText(node);
            }
        };

        // Walk the doc (document) body, replace the title, and observe the body and head
        const walkAndObserve = (doc: Document) => {
            // Do the initial text replacements in the document body and title
            walk(doc.body);
            doc.title = replaceText(doc.title);

            // Observe the body so that we replace text in any added/modified nodes
            let bodyObserver = new MutationObserver(observerCallback);
            bodyObserver.observe(doc.body, {
                characterData: true,
                childList: true,
                subtree: true,
            });
        };

        walkAndObserve(window.document);
    },
});
