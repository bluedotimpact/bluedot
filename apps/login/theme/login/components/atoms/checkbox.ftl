<#macro kw checked=false label="" name="" rest...>
  <div class="flex items-center">
    <input
      <#if checked>checked</#if>

      class="border-2 border-stone-300 h-4 text-bluedot-normal w-4 focus:ring-bluedot-lighter focus:ring-opacity-50"
      id="${name}"
      name="${name}"
      type="checkbox"

      <#list rest as attrName, attrValue>
        ${attrName}="${attrValue}"
      </#list>
    >
    <label class="ml-2 text-secondary-600 text-sm" for="${name}">
      ${label}
    </label>
  </div>
</#macro>
