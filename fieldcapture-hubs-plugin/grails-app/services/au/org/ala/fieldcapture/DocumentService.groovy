package au.org.ala.fieldcapture

import grails.converters.JSON
import static org.apache.http.HttpStatus.*;

/**
 * Proxies to the ecodata DocumentController/DocumentService.
 */
class DocumentService {
    public String ROLE_LOGO = "logo"

    def webService, grailsApplication

    def get(String id) {
        def url = "${grailsApplication.config.ecodata.baseUrl}document/${id}"
        return webService.getJson(url)
    }

    def createTextDocument(doc, content) {
        doc.content = content
        updateDocument(doc)
    }

    def findAllHelpResources() {
        def url = "${grailsApplication.config.ecodata.baseUrl}document/search"
        def result = webService.doPost(url, [role:'helpResource'])
        if (result.statusCode == SC_OK) {
            return result.resp.documents
        }
        return []
    }

    def updateDocument(doc) {
        def url = "${grailsApplication.config.ecodata.baseUrl}document/${doc.documentId?:''}"

        return webService.doPost(url, doc)
    }

    def createDocument(doc, contentType, inputStream) {

        def url = grailsApplication.config.ecodata.baseUrl + "document"

        def params = [document:doc as JSON]
        return webService.postMultipart(url, params, inputStream, contentType, doc.filename)
    }

    def getDocumentsForSite(id) {
        def url = "${grailsApplication.config.ecodata.baseUrl}site/${id}/documents"
        return webService.doPost(url, [:])
    }

    /**
     * This method saves a document that has been staged (the image uploaded, but the document object not
     * created).  The purpose of this is to support atomic create / edits of objects that include document
     * references, e.g. activities containing photo point photos and organisations.
     * @param document the document to save.
     */
    def saveStagedImageDocument(document) {
        def result
        if (!document.documentId) {
            document.remove('url')
            def file = new File(grailsApplication.config.upload.images.path, document.filename)
            // Create a new document, supplying the file that was uploaded to the ImageController.
            result = createDocument(document, document.contentType, new FileInputStream(file))
            if (!result.error) {
                file.delete()
            }
        }
        else {
            // Just update the document.
            result = updateDocument(document)
        }
        result
    }

    def saveLink(link) {
        link.public = true
        link.type = "link"
        link.externalUrl = link.remove('url')
        updateDocument(link)
    }
}
