<#macro kw variant="primary" component="button" rest...>
  <#switch variant>
    <#case "primary">
      <#assign variantClass="bg-bluedot-normal text-white hover:text-bluedot-lighter focus:text-bluedot-lighter">
      <#break>
    <#case "secondary">
      <#assign variantClass="bg-transparent border border-bluedot-normal text-bluedot-normal hover:bg-bluedot-lighter focus:bg-bluedot-lighter">
      <#break>
    <#default>
      <#assign variantClass="bg-bluedot-normal text-white">
  </#switch>

  <${component}
    class="flex items-center justify-center rounded-sm transition-all duration-200 text-sm px-4 py-3 w-fit font-[650] whitespace-nowrap ${variantClass} cursor-pointer focus-visible:outline-1 outline-none outline-offset-0 w-full"

    <#list rest as attrName, attrValue>
      ${attrName}="${attrValue}"
    </#list>
  >
    <#nested>
  </${component}>
</#macro>
