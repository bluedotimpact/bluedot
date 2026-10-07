<#import "template.ftl" as layout>
<#import "components/atoms/button.ftl" as button>
<#import "components/atoms/button-group.ftl" as buttonGroup>
<#import "components/atoms/form.ftl" as form>
<#import "components/atoms/input.ftl" as input>

<@layout.registrationLayout
  displayMessage=!messagesPerField.existsError("email", "username")
  ;
  section
>
  <#if section="title">
    ${msg("loginProfileTitle")}
  <#elseif section="form">
    <@form.kw action=url.loginAction method="post">
      <#if !realm.registrationEmailAsUsername>
        <#if user.editUsernameAllowed>
          <@input.kw
            autocomplete="username"
            autofocus=true
            invalid=messagesPerField.existsError("username")
            label=msg("username")
            message=kcSanitize(messagesPerField.get("username"))
            name="username"
            type="text"
            value=(user.username)!''
          />
        </#if>
      </#if>
      <@input.kw
        autocomplete="email"
        invalid=messagesPerField.existsError("email")
        label=msg("email")
        message=kcSanitize(messagesPerField.get("email"))
        name="email"
        type="email"
        value=(user.email)!''
      />
      <@buttonGroup.kw>
        <#if isAppInitiatedAction??>
          <@button.kw variant="primary" type="submit">
            ${msg("doSubmit")}
          </@button.kw>
          <@button.kw variant="secondary" name="cancel-aia" type="submit" value="true">
            ${msg("doCancel")}
          </@button.kw>
        <#else>
          <@button.kw variant="primary" type="submit">
            ${msg("doSubmit")}
          </@button.kw>
        </#if>
      </@buttonGroup.kw>
    </@form.kw>
  </#if>
</@layout.registrationLayout>
