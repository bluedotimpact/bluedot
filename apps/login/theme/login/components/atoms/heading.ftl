<#macro kw title subtitle="" miniTitle="">
  <#if miniTitle?has_content>
    <p class="font-bold text-sm uppercase">
      ${miniTitle}
    </p>
  </#if>
  <h1 class="font-[600] text-3xl">
    ${title}
  </h1>
  <#if subtitle?has_content>
    <h2 class="text-md">
      ${subtitle}
    </h2>
  </#if>
</#macro>
