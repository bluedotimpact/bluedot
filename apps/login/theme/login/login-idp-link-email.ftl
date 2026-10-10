<#import "template.ftl" as layout>
<#import "components/atoms/link.ftl" as link>

<@layout.registrationLayout; section>
  <#if section = "title">
    ${msg("emailLinkIdpTitle", idpDisplayName)}
  <#elseif section = "form">
    <p id="instruction1" class="instruction">
      ${msg("emailLinkIdp1", idpDisplayName, brokerContext.username, realm.displayName)}
    </p>
    <p id="instruction2" class="instruction">
      ${msg("emailLinkIdp2")} <@link.kw href="${url.loginAction}">${msg("doClickHere")}</@link.kw> ${msg("emailLinkIdp3")}
    </p>
    <p id="instruction3" class="instruction">
      ${msg("emailLinkIdp4")} <@link.kw href="${url.loginAction}">${msg("doClickHere")?c_lower_case}</@link.kw> ${msg("emailLinkIdp5")}
    </p>
  </#if>
</@layout.registrationLayout>
