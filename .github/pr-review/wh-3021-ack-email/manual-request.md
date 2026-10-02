Subject: We've received your {{event.courseName}} group switching request

{{ snippets.hello }}

We have received your request to switch groups:

{% if event.switchType == "Switch group for one unit" %}- **Switch type:** One unit only
{% if event.unitNumber != blank or event.unitTitle != blank %}- **Unit:** {% if event.unitNumber != blank %}Unit {{event.unitNumber}}{% if event.unitTitle != blank %}: {% endif %}{% endif %}{{event.unitTitle}}
{% endif %}- **Current discussion:** {% if event.oldGroupName != blank %}{{event.oldGroupName}}, {% endif %}{{event.oldDiscussionStartTime | date: "%I:%M %p UTC, %B %e"}}
{% else %}- **Switch type:** Permanent (all remaining discussions)
{% if event.oldGroupName != blank %}- **Current group:** {{event.oldGroupName}}
{% endif %}{% endif %}{% if event.notesFromParticipant != blank %}- **Your reason:** {{ event.notesFromParticipant | escape | newline_to_br }}
{% endif %}{% if event.availabilityLink != blank %}- **Your availability:** [view or update]({{event.availabilityLink}})
{% endif %}
A member of our team will review your request and try to find space in another group. This usually takes a few hours, but can take up to 2 business days.

In the meantime you will stay assigned to your original session. Don't worry if you miss this and are marked as absent, this will be corrected if we can find you a new group.

Thanks for your patience!

{{ snippets.footer }}
