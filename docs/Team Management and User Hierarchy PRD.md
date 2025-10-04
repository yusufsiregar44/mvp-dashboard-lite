# Team & User Hierarchy Management - MVP PRD

**Version:** 1.0 | **Scale:** 500 users, 50 teams | **Focus:** Team & resource inheritance

---

## Overview

Automatic access inheritance system with two mechanisms:
1. **Team Membership**: When user joins team → managers inherit team access
2. **Resource Assignment**: When team gets resource → all members (direct + managers) can access it

**Core Equations:** 
- `User joins Team → Manager(s) inherit Team access`
- `Resource assigned to Team → All Team members can access Resource`
- `Combined: User's managers can access all Resources in User's teams`

**Hierarchy Support:**
- Multiple managers per user (no limit)
- 2-3 hierarchy levels deep

---

## Data Model

```sql
-- 5-table design with resources

users {
  id          UUID PRIMARY KEY,
  email       VARCHAR UNIQUE NOT NULL,
  name        VARCHAR NOT NULL
}

user_managers {
  user_id     UUID REFERENCES users(id),
  manager_id  UUID REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY(user_id, manager_id),
  CHECK(user_id != manager_id)
}

teams {
  id          UUID PRIMARY KEY,
  name        VARCHAR UNIQUE NOT NULL
}

team_members {
  team_id     UUID REFERENCES teams(id),
  user_id     UUID REFERENCES users(id),
  access_type ENUM('direct', 'manager') NOT NULL,
  granted_via UUID REFERENCES users(id),  -- NULL if direct, user_id if manager
  PRIMARY KEY(team_id, user_id)
}

resources {
  id          UUID PRIMARY KEY,
  name        VARCHAR NOT NULL,
  type        VARCHAR NOT NULL  -- e.g., 'client', 'project', 'file'
}

team_resources {
  team_id     UUID REFERENCES teams(id),
  resource_id UUID REFERENCES resources(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY(team_id, resource_id)
}
```

---

## Core Use Cases

### 1. Create Team
```
Input:  { name: "Sales Team" }
Action: INSERT INTO teams
Output: { id: uuid, name: "Sales Team" }
```

### 2. Create User
```
Input:  { email: "john@example.com", name: "John Doe" }
Action: INSERT INTO users
Output: { id: uuid, email: "john@example.com", name: "John Doe" }
```

### 3. Create Resource (Client)
```
Input:  { name: "Client A", type: "client" }
Action: INSERT INTO resources
Output: { id: uuid, name: "Client A", type: "client" }
```

### 4. Assign Manager to User
```
Input:  { user_id: alex_id, manager_id: moe_id }
Action: 
  1. Validate: no circular reference, max depth check
  2. INSERT INTO user_managers (user_id, manager_id)
  3. For each team where Alex is direct member:
     - Add Moe with access_type='manager', granted_via=alex_id
     - Add Moe's managers (up to 2-3 levels total)
Output: { success: true, teams_inherited: [team1, team2], managers_affected: [moe, john] }

Note: User can have multiple managers (e.g., functional + project manager)
```

### 5. Add User to Team (with auto-inheritance)
```
Input:  { team_id: team1, user_id: alex_id }
Action: 
  1. INSERT team_members (team_id, user_id, access_type='direct')
  2. Get Alex's managers: SELECT manager_id FROM user_managers WHERE user_id = alex_id
  3. For each manager recursively (up to 3 levels):
     - INSERT team_members (team_id, manager_id, access_type='manager', granted_via=alex_id)
Output: { 
  added: [
    {user: "Alex", type: "direct"},
    {user: "Moe", type: "manager", via: "Alex"},
    {user: "John", type: "manager", via: "Alex"}
  ]
}
```

### 6. Assign Resource to Team
```
Input:  { team_id: team1, resource_id: client_a }
Action: 
  1. INSERT INTO team_resources (team_id, resource_id)
  2. All team members (direct + manager access) can now access this resource
Output: { 
  resource: "Client A",
  team: "Team 1",
  accessible_by: [
    {user: "Alex", access_type: "direct"},
    {user: "Moe", access_type: "manager", via: "Alex"},
    {user: "John", access_type: "manager", via: "Alex"}
  ]
}
```

### 7. Remove User from Team
```
Input:  { team_id: team1, user_id: alex_id }
Action:
  1. DELETE team_members WHERE team_id AND user_id = alex_id
  2. For each manager with access via Alex:
     - Check if they have other subordinates in same team
     - If no other path: DELETE their manager access
     - If other path exists: Keep their access
Output: { 
  removed: [
    {user: "Alex", type: "direct"},
    {user: "Moe", type: "manager"}  // only if no other path
  ],
  resources_lost: ["Client A"]  // if no other team has this resource
}
```

### 8. Remove Resource from Team
```
Input:  { team_id: team1, resource_id: client_a }
Action:
  1. DELETE FROM team_resources WHERE team_id AND resource_id
  2. All team members lose access to this resource (unless they have it via another team)
Output: {
  resource: "Client A",
  team: "Team 1",
  affected_users: ["Alex", "Moe", "John"]
}
```

---

## Access Inheritance Algorithm

```python
def add_user_to_team(team_id: str, user_id: str):
    """
    Adds user to team and propagates access to managers.
    Supports: Multiple managers per user, 2-3 levels deep.
    """
    # Step 1: Add user directly
    db.execute("""
        INSERT INTO team_members (team_id, user_id, access_type, granted_via)
        VALUES (:team_id, :user_id, 'direct', NULL)
    """, team_id=team_id, user_id=user_id)
    
    # Step 2: Get all managers (recursive up to 3 levels)
    managers = db.execute("""
        WITH RECURSIVE mgr_chain AS (
            -- Level 1: Direct managers (can be multiple)
            SELECT 
                user_id as original_user,
                manager_id, 
                1 as level,
                ARRAY[user_id, manager_id] as path
            FROM user_managers
            WHERE user_id = :user_id
            
            UNION ALL
            
            -- Level 2-3: Managers of managers
            SELECT 
                mc.original_user,
                um.manager_id, 
                mc.level + 1,
                mc.path || um.manager_id
            FROM mgr_chain mc
            JOIN user_managers um ON mc.manager_id = um.user_id
            WHERE mc.level < 3  -- Max 3 levels
              AND NOT (um.manager_id = ANY(mc.path))  -- Prevent cycles
        )
        SELECT DISTINCT manager_id, level FROM mgr_chain
    """, user_id=user_id).fetchall()
    
    # Step 3: Add each manager with inherited access
    for manager in managers:
        db.execute("""
            INSERT INTO team_members (team_id, user_id, access_type, granted_via)
            VALUES (:team_id, :manager_id, 'manager', :user_id)
            ON CONFLICT (team_id, user_id) DO NOTHING
        """, team_id=team_id, manager_id=manager['manager_id'], user_id=user_id)
    
    return {
        'user': user_id,
        'managers_added': [m['manager_id'] for m in managers],
        'total_levels': max([m['level'] for m in managers]) if managers else 0
    }
```

---

## Entity Diagram

```
┌─────────────────────────────────────────────────────┐
│                   RELATIONSHIPS                     │
└─────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐
    │  USER    │     │  USER    │
    │  (John)  │     │  (Moe)   │
    └────┬─────┘     └────┬─────┘
         │                │
         │  both manage   │
         └────────┬───────┘
                  │
                  ▼
             ┌──────────┐         ┌──────────┐         ┌──────────┐
             │  USER    │────────>│   TEAM   │────────>│ RESOURCE │
             │  (Alex)  │  member │  (Team1) │   has   │(Client A)│
             │          │   of    │          │         │          │
             └──────────┘         └──────────┘         └──────────┘
                  │                    ▲                     ▲
                  │                    │                     │
                  │                    │ both inherit        │
                  │                    │ (manager access)    │ all members
    ┌─────────────┴─────────────┐      │                     │ can access
    │                           │      │                     │
    ▼                           ▼      │                     │
┌──────────┐              ┌──────────┐ │                     │
│  USER    │──────────────│  USER    │─┘─────────────────────┘
│  (John)  │              │  (Moe)   │
└──────────┘              └──────────┘


┌─────────────────────────────────────────────────────┐
│         RESOURCE ACCESS INHERITANCE                 │
└─────────────────────────────────────────────────────┘

Scenario: Add Alex to Team 1, then assign Client A to Team 1

Step 1: Add Alex to Team 1
  → Team 1 Members:
    - Alex  [direct]
    - Moe   [manager, via Alex]
    - John  [manager, via Alex]

Step 2: Assign Client A to Team 1
  → Client A accessible by:
    - Alex  (via Team 1, direct member)
    - Moe   (via Team 1, manager access)
    - John  (via Team 1, manager access)

Access Path Examples:
  Alex → Team 1 (direct) → Client A
  Moe  → Team 1 (manages Alex) → Client A
  John → Team 1 (manages Moe who manages Alex) → Client A


┌─────────────────────────────────────────────────────┐
│         SCENARIO FLOWS (from diagram)               │
└─────────────────────────────────────────────────────┘

Scenario 1: Add Alex to Team 1
  Trigger: Add Alex to Team 1
  Direct Effect: Alex has access to Client A
  Indirect Effect: Moe & John have access to Client A
  
  [John]
    ↓
  [Moe]  ←─→ [Team 1] ←─→ [Client A]
    ↓
  [Alex]

Scenario 2: Remove Alex from Team 1
  Trigger: Remove Alex from Team 1
  Direct Effect: Alex loses access to Client A
  Indirect Effect: Moe & John lose access to Client A
  
  Result: Team 1 has no members, Client A inaccessible

Scenario 3: Remove Moe as manager of Alex
  Trigger: Remove Moe as manager of Alex
  Direct Effect: Alex has access to Client A (unchanged)
  Indirect Effect: John & Moe lose access to Client A
  
  [John]    [Moe]     (Moe no longer manages Alex)
              
  [Alex] ←─→ [Team 1] ←─→ [Client A]
  
  Result: Only Alex has access

Scenario 4: Remove John as manager of Moe
  Trigger: Remove John as manager of Moe
  Direct Effect: Alex has access to Client A (unchanged)
  Indirect Effect: John loses access to Client A
  
  [John]     (John no longer in chain)
              
  [Moe]
    ↓
  [Alex] ←─→ [Team 1] ←─→ [Client A]
  
  Result: Alex and Moe have access

Scenario 5: Remove Client A from Team 1
  Trigger: Remove Client A from Team 1
  Direct Effect: Alex loses access to Client A
  Indirect Effect: John and Moe lose access to Client A
  
  Result: No one can access Client A
```

---

## API Endpoints

```typescript
// Users
POST   /api/users
  Body: { email, name }
  Returns: User

POST   /api/users/{id}/managers
  Body: { manager_id }
  Returns: { user, manager, inherited_teams[] }

DELETE /api/users/{id}/managers/{managerId}
  Returns: { user, manager, affected_teams[], affected_resources[] }

// Teams
POST   /api/teams
  Body: { name }
  Returns: Team

POST   /api/teams/{id}/members
  Body: { user_id }
  Returns: { added_users: [{user, access_type, granted_via}] }

DELETE /api/teams/{id}/members/{userId}
  Returns: { removed_users: [], affected_resources: [] }

// Resources
POST   /api/resources
  Body: { name, type }
  Returns: Resource

POST   /api/teams/{teamId}/resources
  Body: { resource_id }
  Returns: { resource, team, accessible_by: [] }

DELETE /api/teams/{teamId}/resources/{resourceId}
  Returns: { resource, team, affected_users: [] }

// Queries
GET    /api/users/{id}/teams
  Returns: [{ team, access_type, granted_via_user }]

GET    /api/users/{id}/resources
  Returns: [{ resource, teams: [], access_type }]

GET    /api/teams/{id}/members
  Returns: [{ user, access_type, granted_via_user }]

GET    /api/teams/{id}/resources
  Returns: [{ resource, assigned_at }]

GET    /api/resources/{id}/users
  Returns: [{ user, access_type, teams: [] }]
```

---

## Key Queries

```sql
-- Query 1: Get user's teams with access type
SELECT 
  t.name as team_name,
  tm.access_type,
  u.name as granted_via_user
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
LEFT JOIN users u ON tm.granted_via = u.id
WHERE tm.user_id = :user_id;

-- Query 2: Get user's accessible resources
SELECT DISTINCT
  r.id,
  r.name,
  r.type,
  tm.access_type,
  t.name as via_team
FROM resources r
JOIN team_resources tr ON r.id = tr.resource_id
JOIN team_members tm ON tr.team_id = tm.team_id
JOIN teams t ON tm.team_id = t.id
WHERE tm.user_id = :user_id
ORDER BY r.name;

-- Query 3: Get team members with access details
SELECT 
  u.name as user_name,
  tm.access_type,
  via_user.name as granted_via
FROM team_members tm
JOIN users u ON tm.user_id = u.id
LEFT JOIN users via_user ON tm.granted_via = via_user.id
WHERE tm.team_id = :team_id
ORDER BY tm.access_type, u.name;

-- Query 4: Get all users who can access a specific resource
SELECT DISTINCT
  u.id,
  u.name,
  tm.access_type,
  t.name as via_team,
  via_user.name as granted_via_user
FROM resources r
JOIN team_resources tr ON r.id = tr.resource_id
JOIN team_members tm ON tr.team_id = tm.team_id
JOIN teams t ON tm.team_id = t.id
JOIN users u ON tm.user_id = u.id
LEFT JOIN users via_user ON tm.granted_via = via_user.id
WHERE r.id = :resource_id
ORDER BY tm.access_type, u.name;

-- Query 5: Get team's resources
SELECT 
  r.id,
  r.name,
  r.type,
  tr.assigned_at
FROM resources r
JOIN team_resources tr ON r.id = tr.resource_id
WHERE tr.team_id = :team_id
ORDER BY tr.assigned_at DESC;

-- Query 6: Get user's direct reports
SELECT u.name
FROM users u
JOIN user_managers um ON u.id = um.user_id
WHERE um.manager_id = :manager_id;
```

---

## Validation Rules

```python
# Rule 1: Prevent self-management
if user_id == manager_id:
    raise Error("User cannot manage themselves")

# Rule 2: Prevent circular references
def has_circular_reference(user_id, new_manager_id):
    """
    Check if adding new_manager_id as manager creates a cycle.
    Uses path tracking in recursive query to detect cycles.
    """
    result = db.execute("""
        WITH RECURSIVE subordinate_chain AS (
            SELECT user_id, ARRAY[user_id] as path
            FROM user_managers
            WHERE manager_id = :user_id
            
            UNION ALL
            
            SELECT um.user_id, sc.path || um.user_id
            FROM subordinate_chain sc
            JOIN user_managers um ON sc.user_id = um.manager_id
            WHERE NOT (um.user_id = ANY(sc.path))
        )
        SELECT 1 FROM subordinate_chain WHERE user_id = :new_manager_id
    """, user_id=user_id, new_manager_id=new_manager_id).fetchone()
    
    return result is not None

# Rule 3: Check hierarchy depth (max 3 levels)
def validate_hierarchy_depth(user_id, new_manager_id):
    """
    Ensure adding this manager doesn't exceed 3 levels total.
    """
    # Check depth below user
    depth_below = db.execute("""
        WITH RECURSIVE subordinate_chain AS (
            SELECT user_id, 1 as depth
            FROM user_managers
            WHERE manager_id = :user_id
            
            UNION ALL
            
            SELECT um.user_id, sc.depth + 1
            FROM subordinate_chain sc
            JOIN user_managers um ON sc.user_id = um.manager_id
            WHERE sc.depth < 3
        )
        SELECT COALESCE(MAX(depth), 0) as max_depth FROM subordinate_chain
    """, user_id=user_id).fetchone()['max_depth']
    
    # Check depth above new manager
    depth_above = db.execute("""
        WITH RECURSIVE manager_chain AS (
            SELECT manager_id, 1 as depth
            FROM user_managers
            WHERE user_id = :manager_id
            
            UNION ALL
            
            SELECT um.manager_id, mc.depth + 1
            FROM manager_chain mc
            JOIN user_managers um ON mc.manager_id = um.user_id
            WHERE mc.depth < 3
        )
        SELECT COALESCE(MAX(depth), 0) as max_depth FROM manager_chain
    """, manager_id=new_manager_id).fetchone()['max_depth']
    
    total_depth = depth_below + depth_above + 1
    
    if total_depth > 3:
        raise Error(f"Would create hierarchy depth of {total_depth}, max is 3")
    
    return True

# Rule 4: No limit on number of managers per user
# (User can have multiple managers - functional, project, matrix org)
```

---

## UI Screens (Simplified)

### Screen 1: Teams List
```
┌──────────────────────────────────────────┐
│  Teams (50)                  [+ Create]  │
├──────────────────────────────────────────┤
│  Sales Team          12 members          │
│  Engineering         28 members          │
│  Marketing            8 members          │
└──────────────────────────────────────────┘
```

### Screen 2: Team Detail
```
┌──────────────────────────────────────────┐
│  Team 1                     [+ Add User] │
├──────────────────────────────────────────┤
│  Members (3)                             │
│                                          │
│  Alex               [Direct Member]      │
│  Moe                [Manager] via Alex   │
│  John               [Manager] via Alex   │
│                                          │
│  Resources (1)              [+ Assign]   │
│                                          │
│  Client A           Assigned 2d ago      │
└──────────────────────────────────────────┘
```

### Screen 3: User Detail
```
┌──────────────────────────────────────────┐
│  Alex                 [+ Add Manager]    │
├──────────────────────────────────────────┤
│  Managers (1)                            │
│  • Moe                                   │
│                                          │
│  Teams (1)                               │
│  • Team 1            [Direct Member]     │
│                                          │
│  Accessible Resources (1)                │
│  • Client A          via Team 1          │
└──────────────────────────────────────────┘
```

### Screen 4: Resource Detail
```
┌──────────────────────────────────────────┐
│  Client A             Type: Client       │
├──────────────────────────────────────────┤
│  Assigned to Teams (1)                   │
│  • Team 1            Assigned 2d ago     │
│                                          │
│  Users with Access (3)                   │
│  • Alex              [Direct] via Team 1 │
│  • Moe               [Manager] via Team 1│
│  • John              [Manager] via Team 1│
└──────────────────────────────────────────┘
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User already direct member of team | No-op, return existing |
| Manager already has direct access to team | Keep direct, don't downgrade to manager |
| User has multiple managers | All managers inherit team access |
| Resource assigned to team | All members (direct + manager) can access resource |
| Remove user from team | Remove managers only if no other subordinates in team; affected users lose resource access |
| Remove resource from team | All team members lose access to resource (unless via another team) |
| Assign new manager to user | New manager inherits all user's current teams and resources |
| Remove manager from user | Recalculate: remove manager's team/resource access if no other path |
| User at max depth tries to add manager above | Validate and reject with depth error |
| Multiple inheritance paths to same manager | Single team_members record, track via first subordinate |
| User in multiple teams, both have same resource | User can access resource via multiple paths |

---

## Performance Expectations

| Operation | Expected Time |
|-----------|---------------|
| Add user to team | < 100ms (multiple managers + up to 3-level chain) |
| Assign resource to team | < 20ms (single insert) |
| Get user's resources | < 50ms (join across 3 tables) |
| Get resource's users | < 50ms (join across 3 tables) |
| Create user | < 10ms (simple insert) |
| Create team | < 10ms (simple insert) |
| Create resource | < 10ms (simple insert) |
| Get user's teams | < 20ms (single join) |
| Get team members | < 30ms (single join) |
| Get team resources | < 20ms (single join) |
| Validate circular reference | < 50ms (recursive subordinate check) |
| Validate depth limit | < 50ms (two recursive queries) |

**Why it's still simple for 500 users:**
- Recursive CTEs handle multi-manager, 3-level scenarios efficiently
- Path tracking prevents cycles in single query
- Small dataset means no index tuning needed
- Resource queries are simple joins (no complex aggregation)
- In-memory query execution for validation

---

## Implementation Phases

**Week 1: Core CRUD**
- Create users, teams, resources
- Direct team membership (no inheritance yet)
- Assign resources to teams
- Basic UI for all entities

**Week 2: Manager Hierarchy & Team Inheritance**
- Assign managers to users
- Automatic team inheritance on user team add
- Automatic resource access via team membership
- Manager access badges in UI

**Week 3: Edge Cases & Removal**
- Remove user from team (recalculate managers)
- Remove resource from team
- Manager change recalculation
- Validation rules (circular, depth)

**Week 4: Polish & Queries**
- Resource access queries (who can access what)
- Access path visualization
- Testing all 5 scenarios from diagram
- Documentation

---

## Out of Scope (v1)

- ❌ More than 3 hierarchy levels (3 is max)
- ❌ Temporary access with expiration dates
- ❌ Permission levels (read/write) - all access is full access
- ❌ Bulk import/export
- ❌ Advanced audit trails (who changed what when)
- ❌ Access requests/approval workflows
- ❌ Manager assignment limits (unlimited managers allowed)
- ❌ Resource types beyond basic metadata
- ❌ Team-to-team relationships

---

## Success Criteria

✅ Can create 50 teams and 100 resources in < 10 minutes  
✅ Adding user to team auto-adds their managers  
✅ Assigning resource to team makes it accessible to all members  
✅ UI clearly shows direct vs manager access for both teams and resources  
✅ All queries < 100ms  
✅ All 5 diagram scenarios work correctly:
  1. Add user to team → managers get resource access
  2. Remove user from team → managers lose resource access
  3. Remove manager from user → recalculate resource access
  4. Remove higher-level manager → lower managers keep access
  5. Remove resource from team → all members lose access