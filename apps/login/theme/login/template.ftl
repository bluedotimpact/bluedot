<#import "document.ftl" as document>
<#import "components/atoms/alert.ftl" as alert>
<#import "components/atoms/body.ftl" as body>
<#import "components/atoms/button.ftl" as button>
<#import "components/atoms/card.ftl" as card>
<#import "components/atoms/container.ftl" as container>
<#import "components/atoms/heading.ftl" as heading>
<#import "components/atoms/logo.ftl" as logo>
<#import "components/atoms/bluedot-logo.ftl" as bluedotLogo>
<#import "components/molecules/locale-provider.ftl" as localeProvider>
<#import "components/molecules/username.ftl" as username>

<#macro
  registrationLayout
  displayFooter=false
  displayMessage=true
  displayRequiredFields=false
  script=""
  showAnotherWayIfPresent=true
>
  <#assign cardHeader>
    <#if (realm.displayNameHtml?? && (realm.displayNameHtml == "BlueDot Impact" || realm.displayNameHtml == "BlueDot"))>
      <@bluedotLogo.kw />
    <#else>
      <@logo.kw>
        ${kcSanitize(msg("loginTitleHtml", (realm.displayNameHtml!"")))?no_esc}
      </@logo.kw>
    </#if>
    <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
      <#assign headerTitle><#nested "title"></#assign>
      <#assign headerSubtitle><#nested "subtitle"></#assign>
      <#assign headerMiniTitle><#nested "miniTitle"></#assign>
      <@heading.kw
        title=headerTitle
        subtitle=headerSubtitle
        miniTitle=headerMiniTitle
      />
    <#else>
      <#nested "show-username">
      <@username.kw
        linkHref=url.loginRestartFlowUrl
        linkTitle=msg("restartLoginTooltip")
        name=auth.attemptedUsername
      />
    </#if>
  </#assign>

  <#assign cardContent>
    <#if displayMessage && message?has_content && (message.type != "warning" || !isAppInitiatedAction??)>
      <@alert.kw color=message.type>
        ${kcSanitize(message.summary)?no_esc}
      </@alert.kw>
    </#if>
    <#nested "socialProviders">
    <#nested "form">
    <#if displayRequiredFields>
      <p class="text-secondary-600 text-sm">
        * ${msg("requiredFields")}
      </p>
    </#if>
    <#if auth?has_content && auth.showTryAnotherWayLink() && showAnotherWayIfPresent>
      <form action="${url.loginAction}" method="post">
        <input name="tryAnotherWay" type="hidden" value="on" />
        <@button.kw variant="secondary" type="submit">
          ${msg("doTryAnotherWay")}
        </@button.kw>
      </form>
    </#if>
  </#assign>

  <html<#if realm.internationalizationEnabled> lang="${locale.currentLanguageTag}"</#if>>
    <head>
      <@document.kw script=script />
    </head>
    <@body.kw>
      <@container.kw>
        <@card.kw content=cardContent header=cardHeader />
        <#if displayFooter>
          <#nested "footer">
        </#if>
        <#if realm.internationalizationEnabled && locale.supported?size gt 1>
          <div class="flex justify-around">
            <@localeProvider.kw currentLocale=locale.current locales=locale.supported />
          </div>
        </#if>
      </@container.kw>
    </@body.kw>
  </html>
</#macro>
