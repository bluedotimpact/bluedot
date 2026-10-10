package org.bluedotimpact.keycloak.theme;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.ResourceBundle;

import freemarker.core.HTMLOutputFormat;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateModelException;
import freemarker.template.TemplateNotFoundException;

import org.keycloak.forms.login.LoginFormsPages;
import org.keycloak.forms.login.freemarker.Templates;
import org.keycloak.theme.KeycloakSanitizerMethod;
import org.keycloak.theme.beans.MessageFormatterMethod;
import org.keycloak.theme.beans.MessagesPerFieldBean;

/**
 * Renders every Keycloak login page template in the theme against a fake data model
 * and exits non-zero if any fail. Reads the theme directory from THEME_DIR. Run by run.sh during the Docker build.
 */
public class LoginThemeRenderTest {
  private static final Locale LOCALE = Locale.ENGLISH;
  private static final String BASE_MESSAGE_BUNDLE = "theme/base/login/messages/messages";

  public static void main(String[] args) throws Exception {
    File themeDir = new File(System.getenv("THEME_DIR"));
    Configuration configuration = createFreeMarkerConfiguration(themeDir);
    Map<String, Object> dataModel = LoginDataModel.createDataModel();

    List<String> failures = new ArrayList<>();
    int rendered = 0;
    for (LoginFormsPages page : LoginFormsPages.values()) {
      String templateName = Templates.getTemplate(page);
      try {
        Template template = configuration.getTemplate(templateName);
        StringWriter writer = new StringWriter();
        template.process(dataModel, writer);
        if (writer.toString().isBlank()) {
          failures.add(templateName + ": rendered empty output");
        } else {
          rendered++;
        }
      } catch (TemplateNotFoundException e) {
        // Not overridden by the theme; Keycloak falls back to the parent theme's template
        System.out.println("Skipping " + templateName + " (not in theme)");
      } catch (Exception e) {
        failures.add(templateName + ": " + e.getMessage());
      }
    }

    System.out.println("Rendered " + rendered + " templates");
    if (!failures.isEmpty()) {
      System.err.println(failures.size() + " template(s) failed to render:");
      failures.forEach(f -> System.err.println("  " + f));
      System.exit(1);
    }
  }

  private static Configuration createFreeMarkerConfiguration(File themeDir) throws IOException, TemplateModelException {
    Configuration configuration = new Configuration(Configuration.VERSION_2_3_32);
    configuration.setDirectoryForTemplateLoading(themeDir);
    configuration.setOutputFormat(HTMLOutputFormat.INSTANCE);

    configuration.setSharedVariable("kcSanitize", new KeycloakSanitizerMethod());
    configuration.setSharedVariable("messagesPerField", new MessagesPerFieldBean());
    configuration.setSharedVariable("msg", new MessageFormatterMethod(LOCALE, loadMessages(themeDir)));

    return configuration;
  }

  /** Keycloak's base messages, overlaid with the theme's own, mirroring theme inheritance. */
  private static Properties loadMessages(File themeDir) throws IOException {
    Properties messages = new Properties();

    ResourceBundle base = ResourceBundle.getBundle(BASE_MESSAGE_BUNDLE, LOCALE);
    Enumeration<String> keys = base.getKeys();
    while (keys.hasMoreElements()) {
      String key = keys.nextElement();
      messages.setProperty(key, base.getString(key));
    }

    File themeMessages = new File(themeDir, "messages/messages_en.properties");
    if (themeMessages.exists()) {
      try (InputStream in = new FileInputStream(themeMessages)) {
        messages.load(in);
      }
    }

    return messages;
  }
}
