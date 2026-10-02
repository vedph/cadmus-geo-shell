import { Component, input, model } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { Assertion } from '@myrmidon/cadmus-refs-assertion';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';
import {
  ProperName,
  ProperNameComponent,
} from '@myrmidon/cadmus-refs-proper-name';

import { AssertedToponymComponent } from './asserted-toponym.component';
import { AssertedToponym } from '../asserted-toponyms-part';

@Component({ selector: 'cadmus-refs-proper-name', template: '' })
class MockProperNameComponent {
  public readonly name = model<ProperName | undefined>();
  public readonly tagEntries = input<ThesaurusEntry[] | undefined>();
  public readonly langEntries = input<ThesaurusEntry[] | undefined>();
  public readonly typeEntries = input<ThesaurusEntry[] | undefined>();
  public readonly assTagEntries = input<ThesaurusEntry[] | undefined>();
  public readonly refTypeEntries = input<ThesaurusEntry[] | undefined>();
  public readonly refTagEntries = input<ThesaurusEntry[] | undefined>();
  public readonly lookupProviderOptions = input<
    LookupProviderOptions | undefined
  >();
}

const NAME: ProperName = {
  language: 'lat',
  pieces: [{ type: 'name', value: 'Roma' }],
};

const ASSERTION: Assertion = {
  rank: 1,
  references: [{ citation: 'Liv. 1.1' }],
};

const entries = (prefix: string): ThesaurusEntry[] => [
  { id: prefix + '-a', value: prefix + ' A' },
  { id: prefix + '-b', value: prefix + ' B' },
];

describe('AssertedToponymComponent', () => {
  let component: AssertedToponymComponent;
  let fixture: ComponentFixture<AssertedToponymComponent>;

  const setToponym = async (toponym?: AssertedToponym) => {
    fixture.componentRef.setInput('toponym', toponym);
    await fixture.whenStable();
  };

  const nameEditor = (): MockProperNameComponent =>
    fixture.debugElement.query(By.directive(MockProperNameComponent))
      .componentInstance;

  const refresh = async () => {
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.overrideComponent(AssertedToponymComponent, {
      remove: { imports: [ProperNameComponent] },
      add: { imports: [MockProperNameComponent] },
    });
    await TestBed.configureTestingModule({
      imports: [AssertedToponymComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(AssertedToponymComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create with an empty invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.eid.value).toBeNull();
    expect(component.tag.value).toBeNull();
    expect(component.name.value).toBeNull();
    expect(component.form.invalid).toBe(true);
  });

  describe('updating form from toponym', () => {
    it('should fill the form from a toponym', async () => {
      await setToponym({ eid: 'rome', tag: 'city', name: NAME });

      expect(component.eid.value).toBe('rome');
      expect(component.tag.value).toBe('city');
      expect(component.name.value).toEqual(NAME);
      expect(component.form.valid).toBe(true);
      expect(component.form.pristine).toBe(true);
    });

    it('should set missing eid and tag to null', async () => {
      await setToponym({ name: NAME });
      expect(component.eid.value).toBeNull();
      expect(component.tag.value).toBeNull();
    });

    it('should reset the form when toponym is cleared', async () => {
      await setToponym({ eid: 'rome', tag: 'city', name: NAME });
      await setToponym(undefined);

      expect(component.eid.value).toBeNull();
      expect(component.tag.value).toBeNull();
      expect(component.name.value).toBeNull();
    });
  });

  describe('template', () => {
    it('should pass name and thesauri to the name editor', async () => {
      const ref = fixture.componentRef;
      ref.setInput('nameTagEntries', entries('tag'));
      ref.setInput('nameLangEntries', entries('lang'));
      ref.setInput('nameTypeEntries', entries('type'));
      ref.setInput('assTagEntries', entries('ass'));
      ref.setInput('refTypeEntries', entries('rtype'));
      ref.setInput('refTagEntries', entries('rtag'));
      await setToponym({ name: NAME });

      const editor = nameEditor();
      expect(editor.name()).toEqual(NAME);
      expect(editor.tagEntries()).toEqual(entries('tag'));
      expect(editor.langEntries()).toEqual(entries('lang'));
      expect(editor.typeEntries()).toEqual(entries('type'));
      expect(editor.assTagEntries()).toEqual(entries('ass'));
      expect(editor.refTypeEntries()).toEqual(entries('rtype'));
      expect(editor.refTagEntries()).toEqual(entries('rtag'));
    });

    it('should use a free text tag input when no tag entries', () => {
      expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
      // eid + tag
      expect(
        fixture.nativeElement.querySelectorAll('input[matInput]').length,
      ).toBe(2);
    });

    it('should use a tag select when tag entries are set', async () => {
      fixture.componentRef.setInput('topTagEntries', entries('top'));
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('mat-select')).not.toBeNull();
      // eid only
      expect(
        fixture.nativeElement.querySelectorAll('input[matInput]').length,
      ).toBe(1);
    });

    it('should show error for a too long EID', async () => {
      component.eid.setValue('x'.repeat(501));
      component.eid.markAsDirty();
      component.eid.markAsTouched();
      await refresh();

      expect(component.eid.errors?.['maxlength']).toBeTruthy();
      const error = fixture.nativeElement.querySelector('mat-error');
      expect(error?.textContent).toContain('EID too long');
    });

    it('should show error for a too long free tag', async () => {
      component.tag.setValue('x'.repeat(51));
      component.tag.markAsDirty();
      component.tag.markAsTouched();
      await refresh();

      expect(component.tag.errors?.['maxlength']).toBeTruthy();
      const error = fixture.nativeElement.querySelector('mat-error');
      expect(error?.textContent).toContain('tag too long');
    });

    it('should disable save button when form is pristine or invalid', async () => {
      const saveBtn = (): HTMLButtonElement =>
        fixture.nativeElement.querySelector('button[type="submit"]');
      expect(saveBtn().disabled).toBe(true);

      await setToponym({ name: NAME });
      expect(saveBtn().disabled).toBe(true);

      component.eid.setValue('rome');
      component.eid.markAsDirty();
      await refresh();
      expect(saveBtn().disabled).toBe(false);
    });
  });

  describe('name change', () => {
    it('should update name from the name editor', async () => {
      await setToponym({ name: NAME });
      const changed: ProperName = {
        language: 'ita',
        pieces: [{ type: 'name', value: 'Roma' }],
      };

      nameEditor().name.set(changed);
      await fixture.whenStable();

      expect(component.name.value).toEqual(changed);
      expect(component.name.dirty).toBe(true);
    });

    it('should set name to null when cleared', async () => {
      await setToponym({ name: NAME });
      component.onNameChange(undefined);
      expect(component.name.value).toBeNull();
      expect(component.form.invalid).toBe(true);
    });
  });

  describe('cancel', () => {
    it('should emit editorClose on cancel', () => {
      let closed = false;
      component.editorClose.subscribe(() => (closed = true));
      component.cancel();
      expect(closed).toBe(true);
    });

    it('should emit editorClose when clicking close button', () => {
      let closed = false;
      component.editorClose.subscribe(() => (closed = true));
      (
        fixture.nativeElement.querySelector(
          'button[type="button"]',
        ) as HTMLButtonElement
      ).click();
      expect(closed).toBe(true);
    });
  });

  describe('save', () => {
    it('should not save when form is invalid', () => {
      let saved: AssertedToponym | undefined;
      component.toponym.subscribe((t) => (saved = t));
      component.save();
      expect(saved).toBeUndefined();
    });

    it('should save toponym with trimmed eid and tag', async () => {
      await setToponym({ name: NAME });
      component.eid.setValue('  rome ');
      component.tag.setValue(' city  ');

      let saved: AssertedToponym | undefined;
      component.toponym.subscribe((t) => (saved = t));
      component.save();

      expect(saved).toEqual({ eid: 'rome', tag: 'city', name: NAME });
      expect(component.toponym()).toEqual(saved);
    });

    it('should save empty eid and tag as undefined', async () => {
      await setToponym({ eid: 'rome', tag: 'city', name: NAME });
      component.eid.setValue('  ');
      component.tag.setValue('');
      component.save();

      const saved = component.toponym()!;
      expect(saved.eid).toBeUndefined();
      expect(saved.tag).toBeUndefined();
    });

    it('should preserve the toponym assertion', async () => {
      await setToponym({ eid: 'rome', name: NAME, assertion: ASSERTION });
      component.eid.setValue('roma');
      component.save();

      expect(component.toponym()).toEqual({
        eid: 'roma',
        name: NAME,
        assertion: ASSERTION,
      });
    });

    it('should save on form submit', async () => {
      await setToponym({ name: NAME });
      component.eid.setValue('rome');
      component.eid.markAsDirty();
      await refresh();

      fixture.debugElement.query(By.css('form')).triggerEventHandler(
        'submit',
        {},
      );
      expect(component.toponym()).toEqual({ eid: 'rome', name: NAME });
    });
  });
});
