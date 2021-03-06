package au.org.ala.fieldcapture

import org.codehaus.groovy.grails.web.json.JSONObject

class RoleService {
    def metadataService, cacheService

    public static final String GRANT_MANAGER_ROLE = 'caseManager'
    public static final String PROJECT_ADMIN_ROLE = 'admin'
    public static final String PROJECT_EDITOR_ROLE = 'editor'


    private List roles(Boolean clearCache = false) {
        if (clearCache) {
            log.info "Clearing cache for 'accessLevels'"
            cacheService.clear('accessLevels') // clear cache
        }

        def roles = metadataService.getAccessLevels().collect {
            if (it && it instanceof JSONObject && it.has('name')) {
                it.name
            } else {
                log.warn "Error getting accessLevels: ${it}"
            }
        }

        return roles?:[]
    }

    public List getRoles() {
        def allRoles = roles() // cached

        if (allRoles.size() <= 1) {
            // possible empty list or value, due to previous WS call timing out
            allRoles = roles(true) // reload with cleared cache
        }

        return allRoles
    }

    public List getAugmentedRoles() {
        def rolesCopy = getRoles().clone()
        rolesCopy.addAll(["alaAdmin","siteAdmin","officer","siteReadOnly"]) // augment roles with these extra ones TODO: refactor this

        return rolesCopy
    }

    public Set getAllowedGrantManagerRoles() {
        return new HashSet([GRANT_MANAGER_ROLE])
    }

    public Set getAllowedUserRoles() {
        return new HashSet([PROJECT_ADMIN_ROLE, PROJECT_EDITOR_ROLE])
    }
}
