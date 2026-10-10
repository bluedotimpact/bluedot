<#macro kw color="" component="a" size="" rest...>
  <#switch color>
    <#case "primary">
      <#assign colorClass="text-bluedot-black">
      <#break>
    <#case "secondary">
      <#assign colorClass="text-secondary-600">
      <#break>
    <#case "white">
      <#assign colorClass="text-white">
      <#break>
    <#default>
      <#assign colorClass="text-bluedot-black">
  </#switch>

  <#switch size>
    <#case "small">
      <#assign sizeClass="text-sm">
      <#break>
    <#default>
      <#assign sizeClass="">
  </#switch>

  <${component}
    class="<#compress>${colorClass} ${sizeClass} underline inline-flex</#compress>"

    <#list rest as attrName, attrValue>
      ${attrName}="${attrValue}"
    </#list>
  >
    <#nested>
  </${component}>
</#macro>
