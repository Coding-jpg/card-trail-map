---
id: intro
title: "Overview to Detail"
steps:
  - id: s0
    actions: 
      - type: overview
        zoom: 0.25
  - id: s1
    actions: 
      - type: focus
        card: profile
        zoom: 0.9
      - type: pin
        card: goal-q1-2025
  - id: s2
    actions: 
      - type: focus
        card: hobby-music
        zoom: 0.8
      - type: linkHighlight
        from: hobby-music
        to: proj-music-app
        kind: relates
  - id: s3
    actions: 
      - type: focus
        card: proj-music-app
        zoom: 1.0
      - type: linkHighlight
        from: proj-music-app
        to: skill-react
        kind: uses
      - type: revealMeta
        card: proj-music-app
        fields: ["metrics", "stack"]
  - id: s4
    actions: 
      - type: focus
        card: skill-react
        zoom: 1.1
      - type: pulse
        card: skill-react
---

# Introduction Trail

This trail demonstrates the card-trail mapping system by taking you through a journey from overview to detail, showing how different aspects of a developer's profile connect and relate to each other.

## Journey Overview

1. **Overview**: See the complete landscape of cards and their relationships
2. **Profile**: Focus on the personal profile card as the central hub
3. **Creative Passion**: Explore how hobbies influence projects
4. **Technical Implementation**: Dive into a specific project and its technical details
5. **Skill Deep Dive**: Examine the technical skills that enable the work

This storytelling approach allows viewers to understand not just what you do, but how different aspects of your life and work interconnect and inform each other.