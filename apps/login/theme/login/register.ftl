<#import "template.ftl" as layout>
<#import "components/atoms/button.ftl" as button>
<#import "components/atoms/button-group.ftl" as buttonGroup>
<#import "components/atoms/form.ftl" as form>
<#import "components/atoms/input.ftl" as input>
<#import "components/atoms/link.ftl" as link>
<#import "components/atoms/heading.ftl" as heading>
<#import "components/molecules/identity-provider.ftl" as identityProvider>

<@layout.registrationLayout
  displayFooter=true
  displayMessage=!messagesPerField.existsError("firstName", "lastName", "email", "username", "password", "password-confirm")
  ;
  section
>
  <#if section="miniTitle">
    Sign up
  <#elseif section="title">
    Start learning for free
  <#elseif section="subtitle">
    Create your free account to start learning right away.
  <#elseif section="form">
    <@form.kw action=url.registrationAction method="post">
      <#-- First/last name are optional; the customers realm User Profile does not mark them required. -->
      <div class="flex flex-col gap-4 sm:flex-row">
        <div class="flex-1">
          <@input.kw
            autocomplete="given-name"
            invalid=messagesPerField.existsError("firstName")
            label="First name (optional)"
            message=kcSanitize(messagesPerField.get("firstName"))
            name="firstName"
            required=false
            type="text"
            value=(register.formData.firstName)!''
          />
        </div>
        <div class="flex-1">
          <@input.kw
            autocomplete="family-name"
            invalid=messagesPerField.existsError("lastName")
            label="Last name (optional)"
            message=kcSanitize(messagesPerField.get("lastName"))
            name="lastName"
            required=false
            type="text"
            value=(register.formData.lastName)!''
          />
        </div>
      </div>
      <@input.kw
        autocomplete="email"
        invalid=messagesPerField.existsError("email")
        label=msg("email")
        message=kcSanitize(messagesPerField.get("email"))
        name="email"
        type="email"
        value=(register.formData.email)!''
      />
      <#if !realm.registrationEmailAsUsername>
        <@input.kw
          autocomplete="username"
          invalid=messagesPerField.existsError("username")
          label=msg("username")
          message=kcSanitize(messagesPerField.get("username"))
          name="username"
          type="text"
          value=(register.formData.username)!''
        />
      </#if>
      <#if passwordRequired??>
        <@input.kw
          autocomplete="new-password"
          invalid=messagesPerField.existsError("password", "password-confirm")
          label=msg("password")
          message=kcSanitize(messagesPerField.getFirstError("password", "password-confirm"))
          name="password"
          type="password"
        />
        <@input.kw
          autocomplete="new-password"
          invalid=messagesPerField.existsError("password-confirm")
          label=msg("passwordConfirm")
          message=kcSanitize(messagesPerField.get("password-confirm"))
          name="password-confirm"
          type="password"
        />
      </#if>
      <#if recaptchaRequired??>
        <div class="g-recaptcha" data-sitekey="${recaptchaSiteKey}" data-size="compact"></div>
      </#if>
      <@buttonGroup.kw>
        <@button.kw variant="primary" type="submit">
          Sign up
        </@button.kw>
      </@buttonGroup.kw>
    </@form.kw>
  <#elseif section="footer">
    <div class="text-center text-white">
      Already have an account?
      <@link.kw color="white" href=url.loginUrl>
        ${msg("doLogIn")}
      </@link.kw>
    </div>
  <#elseif section="socialProviders">
    <#if realm.password && social.providers??>
      <@identityProvider.kw providers=social.providers />
    </#if>
  </#if>
</@layout.registrationLayout>
