
  export namespace Schemas {
    // <Schemas>
  export type ApplicationStatus = ("applied" | "screening" | "interviewing" | "offer" | "rejected")
export type ApplicationSort = ("-appliedAt" | "appliedAt" | "company")
export type ApplicationSummary = { id: string, companyName: string, position: string, status: ApplicationStatus, appliedAt: string }
export type ApplicationPage = { items: Array<ApplicationSummary>, total: number, pageSize: number }
export type ApplicationDetail = { id: string, companyId: string, companyName: string, position: string, status: ApplicationStatus, appliedAt: string, salary?: string, notes: string }
export type CreateApplicationInput = { companyId: string, position: string, appliedAt: string, salary?: string, notes?: string }
export type UpdateApplicationInput = { status: ApplicationStatus }
export type InterviewKind = ("phone" | "video" | "onsite")
export type Interview = { id: string, kind: InterviewKind, scheduledAt: string, interviewer: string }
export type Company = { id: string, name: string }

    // </Schemas>
    }
  
  export namespace Endpoints {
  // <Endpoints>
  
  export type get_ListApplications = {
      method: "GET",
      path: "/api/applications",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            query?:  Partial<{ status: Array<Schemas.ApplicationStatus>, sort: Schemas.ApplicationSort, page: number }>,
        
        
        
        
          }
      responses: {200: Schemas.ApplicationPage,
},
      
    }
export type post_CreateApplication = {
      method: "POST",
      path: "/api/applications",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            
        
        
        
        body:  Schemas.CreateApplicationInput,
          }
      responses: {201: Schemas.ApplicationDetail,
},
      
    }
export type get_GetApplication = {
      method: "GET",
      path: "/api/applications/{applicationId}",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            
        path:  { applicationId: string },
        
        
        
          }
      responses: {200: Schemas.ApplicationDetail,
404: unknown,
},
      
    }
export type patch_UpdateApplication = {
      method: "PATCH",
      path: "/api/applications/{applicationId}",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            
        path:  { applicationId: string },
        
        
        body:  Schemas.UpdateApplicationInput,
          }
      responses: {200: Schemas.ApplicationDetail,
404: unknown,
},
      
    }
export type delete_DeleteApplication = {
      method: "DELETE",
      path: "/api/applications/{applicationId}",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            
        path:  { applicationId: string },
        
        
        
          }
      responses: {204: unknown,
404: unknown,
},
      
    }
export type get_ListInterviews = {
      method: "GET",
      path: "/api/applications/{applicationId}/interviews",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            
        path:  { applicationId: string },
        
        
        
          }
      responses: {200: Array<Schemas.Interview>,
404: unknown,
},
      
    }
export type get_SearchCompanies = {
      method: "GET",
      path: "/api/companies",
      requestFormat: "json",
      responseFormat: "json",
      parameters: {
            query:  { q: string },
        
        
        
        
          }
      responses: {200: Array<Schemas.Company>,
},
      
    }

  // </Endpoints>
  }
  
  
     // <EndpointByMethod>
     export type EndpointByMethod = {
     get: {
           "/api/applications": Endpoints.get_ListApplications,
"/api/applications/{applicationId}": Endpoints.get_GetApplication,
"/api/applications/{applicationId}/interviews": Endpoints.get_ListInterviews,
"/api/companies": Endpoints.get_SearchCompanies
         },
post: {
           "/api/applications": Endpoints.post_CreateApplication
         },
patch: {
           "/api/applications/{applicationId}": Endpoints.patch_UpdateApplication
         },
delete: {
           "/api/applications/{applicationId}": Endpoints.delete_DeleteApplication
         }
     }
     
     // </EndpointByMethod>
     

    // <EndpointByMethod.Shorthands>
    export type GetEndpoints = EndpointByMethod["get"]
export type PostEndpoints = EndpointByMethod["post"]
export type PatchEndpoints = EndpointByMethod["patch"]
export type DeleteEndpoints = EndpointByMethod["delete"]
    // </EndpointByMethod.Shorthands>
    