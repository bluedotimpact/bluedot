<#import "template.ftl" as layout>
<#import "components/atoms/button.ftl" as button>
<#import "components/atoms/button-group.ftl" as buttonGroup>
<#import "components/atoms/form.ftl" as form>
<#import "components/atoms/input.ftl" as input>
<#import "components/atoms/link.ftl" as link>
<#import "features/labels/username.ftl" as usernameLabel>

<#assign usernameLabel><@usernameLabel.kw /></#assign>

<@layout.registrationLayout
  displayFooter=true
  displayMessage=!messagesPerField.existsError("username")
  ;
  section
>
  <#if section="title">
    ${msg("emailForgotTitle")}
  <#elseif section="form">
    <p>${msg("emailInstruction")}</p>
    <@form.kw action=url.loginAction method="post">
      <@input.kw
        autocomplete=realm.loginWithEmailAllowed?string("email", "username")
        autofocus=true
        invalid=messagesPerField.existsError("username")
        label=usernameLabel
        message=kcSanitize(messagesPerField.get("username"))
        name="username"
        type="text"
        value=(auth?has_content && auth.showUsername())?then(auth.attemptedUsername, '')
      />
      <@buttonGroup.kw>
        <@button.kw variant="primary" type="submit">
          ${msg("doSubmit")}
        </@button.kw>
      </@buttonGroup.kw>
    </@form.kw>
  <#elseif section="footer">
    <div class="text-center text-white">
      <@link.kw color="white" href=url.loginUrl>
        ${kcSanitize(msg("backToLogin"))?no_esc}
      </@link.kw>
    </div>
  </#if>
</@layout.registrationLayout>
