<#import "template.ftl" as layout>
<#import "components/atoms/button.ftl" as button>
<#import "components/atoms/button-group.ftl" as buttonGroup>

<@layout.registrationLayout; section>
  <#if section="title">
    ${msg("pageExpiredTitle")}
  <#elseif section="form">
    <@buttonGroup.kw>
      <@button.kw variant="primary" component="a" href=url.loginRestartFlowUrl>
        ${msg("doTryAgain")}
      </@button.kw>
      <@button.kw variant="secondary" component="a" href=url.loginAction>
        ${msg("doContinue")}
      </@button.kw>
    </@buttonGroup.kw>
  </#if>
</@layout.registrationLayout>
