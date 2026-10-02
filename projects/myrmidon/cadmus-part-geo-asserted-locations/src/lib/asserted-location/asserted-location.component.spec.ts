import { Component, input, model, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { Assertion, AssertionComponent } from '@myrmidon/cadmus-refs-assertion';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';
import { GeoLocation, GeoLocationEditor } from '@myrmidon/cadmus-geo-location';

import { AssertedLocationComponent } from './asserted-location.component';
import { AssertedLocation } from '../asserted-locations-part';

// lightweight stand-ins for the heavy child editors (the geo-location editor
// creates a MapLibre map, which requires WebGL unavailable in jsdom)
@Component({ selector: 'cadmus-geo-location-editor', template: '' })
class MockGeoLocationEditor {
  public readonly location = model<GeoLocation | undefined>();
  public readonly cancelEdit = output<void>();
}

@Component({ selector: 'cadmus-refs-assertion', template: '' })
class MockAssertionComponent {
  public readonly assertion = model<Assertion | undefined>();
  public readonly assTagEntries = input<ThesaurusEntry[] | undefined>();
  public readonly refTypeEntries = input<ThesaurusEntry[] | undefined>();
  public readonly refTagEntries = input<ThesaurusEntry[] | undefined>();
  public readonly lookupProviderOptions = input<
    LookupProviderOptions | undefined
  >();
}

const GEO: GeoLocation = {
  label: 'Rome',
  latitude: 41.9,
  longitude: 12.5,
};

const ASSERTION: Assertion = {
  rank: 1,
  tag: 'ass-tag',
  references: [{ citation: 'Liv. 1.1', type: 'book' }],
};

const TAG_ENTRIES: ThesaurusEntry[] = [
  { id: 'capital', value: 'capital' },
  { id: 'village', value: 'village' },
];

describe('AssertedLocationComponent', () => {
  let component: AssertedLocationComponent;
  let fixture: ComponentFixture<AssertedLocationComponent>;

  const setLocation = async (location?: AssertedLocation) => {
    fixture.componentRef.setInput('location', location);
    await fixture.whenStable();
  };

  const geoEditor = (): MockGeoLocationEditor =>
    fixture.debugElement.query(By.directive(MockGeoLocationEditor))
      .componentInstance;

  const assertionEditor = (): MockAssertionComponent | undefined =>
    fixture.debugElement.query(By.directive(MockAssertionComponent))
      ?.componentInstance;

  beforeEach(async () => {
    TestBed.overrideComponent(AssertedLocationComponent, {
      remove: { imports: [GeoLocationEditor, AssertionComponent] },
      add: { imports: [MockGeoLocationEditor, MockAssertionComponent] },
    });
    await TestBed.configureTestingModule({
      imports: [AssertedLocationComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(AssertedLocationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create with an empty invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.value.value).toBeNull();
    expect(component.hasAssertion.value).toBe(false);
    expect(component.assertion.value).toBeNull();
    expect(component.tag.value).toBeNull();
    expect(component.form.invalid).toBe(true);
  });

  describe('updating form from location', () => {
    it('should fill the form from a location without assertion', async () => {
      await setLocation({ value: GEO, tag: 'capital' });

      expect(component.value.value).toEqual(GEO);
      expect(component.hasAssertion.value).toBe(false);
      expect(component.assertion.value).toBeNull();
      expect(component.tag.value).toBe('capital');
      expect(component.form.valid).toBe(true);
      expect(component.form.pristine).toBe(true);
    });

    it('should fill the form from a location with assertion', async () => {
      await setLocation({ value: GEO, assertion: ASSERTION });

      expect(component.hasAssertion.value).toBe(true);
      expect(component.assertion.value).toEqual(ASSERTION);
      expect(component.tag.value).toBeNull();
    });

    it('should reset the form when location is cleared', async () => {
      await setLocation({ value: GEO, tag: 'x', assertion: ASSERTION });
      await setLocation(undefined);

      expect(component.value.value).toBeNull();
      expect(component.hasAssertion.value).toBe(false);
      expect(component.assertion.value).toBeNull();
      expect(component.tag.value).toBeNull();
    });

    it('should pass the location value to the geo-location editor', async () => {
      await setLocation({ value: GEO });
      expect(geoEditor().location()).toEqual(GEO);
    });
  });

  describe('template', () => {
    it('should show "no location" when there is no value', () => {
      const desc = fixture.nativeElement.querySelector(
        'mat-panel-description',
      ) as HTMLElement;
      expect(desc.textContent).toContain('no location');
    });

    it('should show label and coordinates when there is a value', async () => {
      await setLocation({ value: GEO });
      const desc = fixture.nativeElement.querySelector(
        'mat-panel-description',
      ) as HTMLElement;
      expect(desc.textContent).toContain('Rome (41.9, 12.5)');
    });

    it('should use a free text tag input when no tag entries', () => {
      expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
      expect(
        fixture.nativeElement.querySelector('input[matInput]'),
      ).not.toBeNull();
    });

    it('should use a tag select when tag entries are set', async () => {
      fixture.componentRef.setInput('locTagEntries', TAG_ENTRIES);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('mat-select')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('input[matInput]')).toBeNull();
    });

    it('should show error for a too long free tag', async () => {
      // mat-error is displayed only when the control is in error state,
      // i.e. invalid and touched
      component.tag.setValue('x'.repeat(51));
      component.tag.markAsDirty();
      component.tag.markAsTouched();
      fixture.changeDetectorRef.markForCheck();
      await fixture.whenStable();

      expect(component.tag.errors?.['maxlength']).toBeTruthy();
      const error = fixture.nativeElement.querySelector('mat-error');
      expect(error?.textContent).toContain('tag too long');
    });

    it('should show the assertion editor only when hasAssertion is checked', async () => {
      expect(assertionEditor()).toBeUndefined();

      fixture.componentRef.setInput('assTagEntries', TAG_ENTRIES);
      await setLocation({ value: GEO, assertion: ASSERTION });

      const editor = assertionEditor()!;
      expect(editor).toBeTruthy();
      expect(editor.assertion()).toEqual(ASSERTION);
      expect(editor.assTagEntries()).toEqual(TAG_ENTRIES);
    });

    it('should disable save button when form is pristine or invalid', async () => {
      const saveBtn = (): HTMLButtonElement =>
        fixture.nativeElement.querySelector('button[type="submit"]');
      expect(saveBtn().disabled).toBe(true);

      await setLocation({ value: GEO });
      expect(saveBtn().disabled).toBe(true);

      component.tag.setValue('t');
      component.tag.markAsDirty();
      fixture.changeDetectorRef.markForCheck();
      await fixture.whenStable();
      expect(saveBtn().disabled).toBe(false);
    });
  });

  describe('child editors events', () => {
    it('should update value and collapse panel on location change', async () => {
      component.onLocationToggle(true);
      expect(component.locationExpanded()).toBe(true);

      geoEditor().location.set(GEO);
      await fixture.whenStable();

      expect(component.value.value).toEqual(GEO);
      expect(component.value.dirty).toBe(true);
      expect(component.locationExpanded()).toBe(false);
      expect(component.form.valid).toBe(true);
    });

    it('should collapse panel on location editor cancel', async () => {
      component.onLocationToggle(true);
      geoEditor().cancelEdit.emit();
      await fixture.whenStable();
      expect(component.locationExpanded()).toBe(false);
    });

    it('should update assertion on assertion change', async () => {
      await setLocation({ value: GEO, assertion: ASSERTION });
      const changed: Assertion = { ...ASSERTION, rank: 3 };

      assertionEditor()!.assertion.set(changed);
      await fixture.whenStable();

      expect(component.assertion.value).toEqual(changed);
      expect(component.assertion.dirty).toBe(true);
    });

    it('should set assertion to null when assertion is cleared', () => {
      component.onAssertionChange(ASSERTION);
      component.onAssertionChange(undefined);
      expect(component.assertion.value).toBeNull();
    });
  });

  describe('close', () => {
    it('should emit editorClose on close', () => {
      let closed = false;
      component.editorClose.subscribe(() => (closed = true));
      component.close();
      expect(closed).toBe(true);
    });

    it('should emit editorClose when clicking close button', () => {
      let closed = false;
      component.editorClose.subscribe(() => (closed = true));
      (
        fixture.nativeElement.querySelector(
          'button[type="button"][mattooltip="Close"]',
        ) as HTMLButtonElement
      ).click();
      expect(closed).toBe(true);
    });
  });

  describe('save', () => {
    it('should not save when form is invalid', () => {
      let saved: AssertedLocation | undefined;
      component.location.subscribe((l) => (saved = l));
      component.save();
      expect(saved).toBeUndefined();
      expect(component.location()).toBeUndefined();
    });

    it('should save location with trimmed tag and assertion', async () => {
      await setLocation({ value: GEO });
      component.tag.setValue('  capital  ');
      component.hasAssertion.setValue(true);
      component.onAssertionChange(ASSERTION);

      let saved: AssertedLocation | undefined;
      component.location.subscribe((l) => (saved = l));
      component.save();

      const expected: AssertedLocation = {
        value: GEO,
        tag: 'capital',
        assertion: ASSERTION,
      };
      expect(saved).toEqual(expected);
      expect(component.location()).toEqual(expected);
    });

    it('should drop assertion when hasAssertion is unchecked', async () => {
      await setLocation({ value: GEO, assertion: ASSERTION });
      component.hasAssertion.setValue(false);
      component.save();
      expect(component.location()!.assertion).toBeUndefined();
    });

    it('should drop assertion when hasAssertion is checked but empty', async () => {
      await setLocation({ value: GEO });
      component.hasAssertion.setValue(true);
      component.save();
      expect(component.location()!.assertion).toBeUndefined();
    });

    it('should save an empty tag as undefined', async () => {
      await setLocation({ value: GEO, tag: 'x' });
      component.tag.setValue('   ');
      component.save();
      expect(component.location()!.tag).toBeUndefined();
    });

    it('should save on form submit', async () => {
      await setLocation({ value: GEO });
      component.tag.setValue('t');
      component.tag.markAsDirty();
      fixture.changeDetectorRef.markForCheck();
      await fixture.whenStable();

      const form = fixture.debugElement.query(By.css('form'));
      form.triggerEventHandler('submit', {});
      expect(component.location()).toEqual({ value: GEO, tag: 't' });
    });
  });
});
