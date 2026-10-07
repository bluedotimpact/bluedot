<#import "/assets/providers/providers.ftl" as providerIcons>
<#import "/components/atoms/button.ftl" as button>

<#macro kw providers=[]>
  <#if providers?has_content>
    <div class="flex flex-col gap-4">
      <#list providers as provider>
      <@button.kw 
        variant="secondary"
        component="a"
        data\-provider="${provider.alias}"
        href="${provider.loginUrl}"
        type="button"
      >
        <#if providerIcons[provider.alias]??>
          <div class="size-4 mr-2">
            <@providerIcons[provider.alias] />
          </div>
        </#if>
        <p>
          Continue with ${provider.displayName!}
        </p>
      </@button.kw>
      </#list>
    </div>
    <div class="separate text-secondary-600 text-sm">
      OR
    </div>
  </#if>
</#macro>
