<#import "template.ftl" as layout>
<#import "components/atoms/button.ftl" as button>
<#import "components/atoms/button-group.ftl" as buttonGroup>
<#import "components/atoms/form.ftl" as form>
<#import "components/atoms/link.ftl" as link>

<#-- Overrides the base theme's page, which passes displayInfo=true and so fails to render with our template.ftl -->
<@layout.registrationLayout; section>
  <#if section = "title">
    ${msg("emailVerifyTitle")}
  <#elseif section = "form">
    <p id="instruction1" class="instruction">
      <#if verifyEmail??>
        ${msg("emailVerifyInstruction1", verifyEmail)}
      <#else>
        ${msg("emailVerifyInstruction4", user.email)}
      </#if>
    </p>
    <#if isAppInitiatedAction??>
      <@form.kw action=url.loginAction method="post">
        <@buttonGroup.kw>
          <@button.kw variant="primary" type="submit">
            <#if verifyEmail??>${msg("emailVerifyResend")}<#else>${msg("emailVerifySend")}</#if>
          </@button.kw>
          <@button.kw variant="secondary" name="cancel-aia" type="submit" value="true">
            ${msg("doCancel")}
          </@button.kw>
        </@buttonGroup.kw>
      </@form.kw>
    <#else>
      <p id="instruction2" class="instruction">
        ${msg("emailVerifyInstruction2")} <@link.kw href="${url.loginAction}">${msg("doClickHere")}</@link.kw> ${msg("emailVerifyInstruction3")}
      </p>
    </#if>
  </#if>
</@layout.registrationLayout>
