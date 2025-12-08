
        alter table relationships 
        add column project_id uuid references projects(id) on delete cascade;
        
