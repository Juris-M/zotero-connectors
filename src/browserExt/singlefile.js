/*
    ***** BEGIN LICENSE BLOCK *****
    
    Copyright © 2020 Corporation for Digital Scholarship
            Vienna, Virginia, USA
            https://www.zotero.org
    
    This file is part of Zotero.
    
    Zotero is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    Zotero is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with Zotero.  If not, see <http://www.gnu.org/licenses/>.
    
    ***** END LICENSE BLOCK *****
*/

Zotero.SingleFile = {
	retrievePageData: async function(payload) {
        var attachmentInfo = {};
        if (payload && payload.items && payload.items[0] && payload.items[0].attachments && payload.items[0].attachments[0]) {
            attachmentInfo = payload.items[0].attachments[0];
            attachmentInfo.url = payload.uri;
        }
		try {
			// Call to background script to inject SingleFile
			await Zotero.Connector_Browser.injectSingleFile();

			Zotero.debug("SingleFile: Retrieving page data");
			var pageData = await singlefile.extension.getPageData(Zotero.SingleFile.CONFIG);

			// Jurism trim
			// If css is present in attachmentInfo, attempt to process with Jurism trim
			// params, if any.
			if (attachmentInfo.css) {
                Zotero.debug(`Jurism: trimming page content`);
				// Clip body content from serialized HTML and push it into a dummy document
				var content = pageData.content;
				var offset = content.indexOf("<body");
				content = content.slice(offset);
				var offset = content.indexOf(">");
				content = content.slice(offset+1);
				var offset = content.indexOf("</body>");
				if (offset > -1) {
					content = content.slice(0, offset+1);
				}
				var newDoc = document.implementation.createHTMLDocument(attachmentInfo.title);
				newDoc.body.innerHTML = content;
				
				// Try for elementID, elementClass, and elementName
				// in sequence, and process with the first one that
				// exists and finds one or more elements.
				let id = attachmentInfo.elementID, cls = attachmentInfo.elementClass, tagName = attachmentInfo.elementName;
				var elems = [];
				if (id) {
					elems.push(newDoc.getElementById(id));
				}
				if (elems.length === 0 && cls) {
					elems = newDoc.getElementsByClassName(cls);
				}
				if (elems.length === 0 && tagName) {
					elems = getElementsByTagName(tagName);
				}
				if (elems.length > 0) {
					var dummy = newDoc.createElement("div");
					var mlzOuter = newDoc.createElement("div");
					mlzOuter.setAttribute("class", "mlz-outer");
					dummy.appendChild(mlzOuter);
					for (var elem of elems) {
						var newElem = elem.cloneNode(true);
						mlzOuter.appendChild(newElem);
					}
					pageData.content = "<html>\n"
						+ "  <head>\n"
						+ "    <title>" + attachmentInfo.title + "</title>\n"
						+ "    <style>" + attachmentInfo.css + "</style>\n"
						+ "  </head>"
						+ "  <body>\n"
						+ dummy.innerHTML
						+ "    <hr/>\n"
						+ "    <p><b>Source:</b><a href=\"" +attachmentInfo.url + "\">" + attachmentInfo.url + "</a></p>"
						+ "  </body>\n"
						+ "</html>";
				}
			}
			Zotero.debug("SingleFile: Done retrieving page data");

			return pageData.content;
		} catch (e) {
			Zotero.debug("SingleFile: Error retrieving page data", 2);
			Zotero.debug(e.stack, 2);
			throw e;
		}
	}
};
