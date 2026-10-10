<#macro kw color="">
  <#switch color>
    <#case "error">
      <#assign colorClass="bg-red-100 text-red-600 border-red-600">
      <#break>
    <#case "info">
      <#assign colorClass="bg-bluedot-lighter text-bluedot-normal border-bluedot-normal">
      <#break>
    <#case "success">
      <#assign colorClass="bg-green-100 text-green-600 border-green-600">
      <#break>
    <#case "warning">
      <#assign colorClass="bg-orange-100 text-orange-600 border-orange-600">
      <#break>
    <#default>
      <#assign colorClass="bg-blue-100 text-blue-600 border-blue-600">
  </#switch>

  <div class="${colorClass} border-l-4 p-4 text-sm" role="alert">
    <#nested>
  </div>
</#macro>
