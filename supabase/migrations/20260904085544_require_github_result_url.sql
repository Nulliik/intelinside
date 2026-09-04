alter table public.results
add constraint results_repo_url_github_check
check (repo_url ~* '^https://(www[.])?github[.]com(/|$)') not valid;
