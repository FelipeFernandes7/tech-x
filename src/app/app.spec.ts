import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the task dashboard', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Vamos fazer acontecer');
    expect(compiled.querySelectorAll('.task-row').length).toBe(5);
  });

  it('should validate and create a task', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.openCreateForm();
    app.saveTask();
    expect(app.taskForm.controls.title.touched).toBe(true);
    expect(app.tasks().length).toBe(5);

    app.taskForm.controls.title.setValue('Publicar atualização');
    app.taskForm.controls.description.setValue('Revisar os detalhes finais.');
    app.saveTask();

    expect(app.tasks().length).toBe(6);
    expect(app.tasks()[0].title).toBe('Publicar atualização');
    expect(app.isFormOpen()).toBe(false);
  });

  it('should toggle and confirm removal of a task', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const taskId = app.tasks()[0].id;

    app.toggleTask(taskId);
    expect(app.tasks().find((task) => task.id === taskId)?.completed).toBe(true);

    app.requestDelete(taskId);
    expect(app.tasks().length).toBe(5);
    app.confirmDelete(taskId);
    expect(app.tasks().some((task) => task.id === taskId)).toBe(false);
  });
});
