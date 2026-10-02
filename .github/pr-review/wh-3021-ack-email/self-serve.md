Subject: We're processing your {{event.courseName}} group switching request

{{ snippets.hello }}

We are processing your request to switch groups:

{% if event.switchType == "Switch group for one unit" %}- **Switch type:** One unit only
{% if event.unitNumber != blank or event.unitTitle != blank %}- **Unit:** {% if event.unitNumber != blank %}Unit {{event.unitNumber}}{% if event.unitTitle != blank %}: {% endif %}{% endif %}{{event.unitTitle | default: ""}}
{% endif %}{% if event.oldDiscussionStartTime != blank %}- **From:** {% if event.oldGroupName != blank %}{{event.oldGroupName}}, {% endif %}{{event.oldDiscussionStartTime | date: "%I:%M %p UTC, %B %e"}}
{% endif %}- **To:** {{event.newGroupName}}, {{event.newDiscussionStartTime | date: "%I:%M %p UTC, %B %e"}}
{% else %}- **Switch type:** Permanent (all remaining discussions)
{% if event.oldGroupName != blank %}- **From:** {{event.oldGroupName}}
{% endif %}- **To:** {{event.newGroupName}}
{% endif %}{% if event.notesFromParticipant != blank %}- **Your reason:** {{ event.notesFromParticipant | escape | newline_to_br }}
{% endif %}
You should shortly receive a calendar invite for the group discussions and be added to the group's Slack channel.

Hope you have an insightful discussion!

{{ snippets.footer }}
