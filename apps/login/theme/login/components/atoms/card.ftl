<#macro kw content="" footer="" header="">
  <div class="bg-cream-normal rounded-lg p-12 space-y-8">
    <#if header?has_content>
      <div class="space-y-2">
        ${header}
      </div>
    </#if>
    <#if content?has_content>
      <div class="space-y-4">
        ${content}
      </div>
    </#if>
    <#if footer?has_content>
      <div class="space-y-4">
        ${footer}
      </div>
    </#if>
  </div>
</#macro>
