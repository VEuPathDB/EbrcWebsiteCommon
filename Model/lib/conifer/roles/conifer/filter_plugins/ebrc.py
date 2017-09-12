from __future__ import absolute_import
import re
from ansible.errors import AnsibleFilterError

production_hosts = [
  'w1.',
  'w2.',
]

def prod_prom_ctx(ctx, fqdn):
  '''
  EBRC Tomcat webapp context names are of the form `toxo.b10` (variable
  build number for each release cycle) for non-released sites and `toxo`
  for the released version (always same static name for public-facing
  sites). Filesystem directory names which scripts use to derive the
  webapp name use the former syntax regardless of the site's release
  status. This function converts an input `toxo.b10` name (say, derived
  from file conventions) to the `toxo` release format for fqdn that
  match criteria.
  '''
  r = re.compile(r"(.*\.)?(\w+\.\w+)$")
  m = r.match(fqdn)
  if m is not None and m.group(1) is not None:
    host = m.group(1)
  else:
    host = ''
    
  if host in production_hosts:
    return ctx.split('.', 1)[0]
  return ctx


class FilterModule(object):
  '''
  custom jinja2 filters for EuPathDB BRC
  '''

  def filters(self):
    return {
      'prod_prom_ctx': prod_prom_ctx,
    }
