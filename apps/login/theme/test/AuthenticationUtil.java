package org.bluedotimpact.keycloak.theme;

import java.util.List;

import freemarker.template.TemplateMethodModelEx;
import freemarker.template.TemplateModelException;

public class AuthenticationUtil implements TemplateMethodModelEx {
  @Override
  public Object exec(List arguments) throws TemplateModelException {
    return true;
  }
}
