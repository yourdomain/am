$(document).ready(function () {
    const associationKey = 'associations';
    const memberPrefix = 'members-';
    const placeholderImage = './assets/placeholder.png';

    // Initialize associations data
    function initializeData() {
        if (!localStorage.getItem(associationKey)) {
            localStorage.setItem(associationKey, JSON.stringify([]));
        }
        loadAssociations();
        updateBreadcrumb('');
    }

    // Update the breadcrumb navigation text
    function updateBreadcrumb(path) {
        $('#breadcrumb').text(path || '').css({
            'font-size': '1.2rem',
            'color': '#555',
            'text-align': 'right',
            'padding': '5px',
        });
    }

    // Hide all sections
    function hideAllSections() {
        $('#associations-section').addClass('hidden');
        $('#association-form-section').addClass('hidden');
        $('#members-section').addClass('hidden');
        $('#member-form-section').addClass('hidden');
    }

    // Clear the association form
    function clearAssociationForm() {
        $('#association-id').val('');
        $('#association-name').val('');
        $('#association-reg').val('');
        $('#association-address').val('');
        $('#association-photo').val('');
    }

    // Validate the association form
    function validateAssociationForm() {
        const name = $('#association-name').val().trim();
        const reg = $('#association-reg').val().trim();
        if (!name || !reg) {
            alert('Name and Registration Number are mandatory.');
            return false;
        }

        const associations = JSON.parse(localStorage.getItem(associationKey));
        const duplicate = associations.some(
            (a) => a.reg === reg && a.id !== $('#association-id').val()
        );

        if (duplicate) {
            alert('Registration Number must be unique.');
            return false;
        }
        return true;
    }

    // Load associations and render them in the list
    function loadAssociations() {
        const associations = JSON.parse(localStorage.getItem(associationKey));
        $('#associations-list').empty();

        associations.forEach((association) => {
            const photo = association.photo || placeholderImage;
            $('#associations-list').append(`
                <div class="association-card">
                    <div class="association-details">
                        <img src="${photo}" alt="${association.name}" class="association-thumbnail">
                        <div class="association-info">
                            <h3>${association.name}</h3>
                            <p><strong>Regd. No:</strong> ${association.reg}</p>
                            <p><strong>Address:</strong> ${association.address}</p>
                        </div>
                    </div>
                    <div class="association-actions">
                        <button onclick="navigateToMembers('${association.id}')">Members</button>
                        <button onclick="editAssociation('${association.id}')">Edit</button>
                        <button onclick="deleteAssociation('${association.id}')">Delete</button>
                        <button onclick="exportAssociation('${association.id}')">Export</button>
                        <button onclick="generatePDF('${association.id}')">Print</button>
                    </div>
                </div>
            `);
        });
    }



    // Edit an association
    function editAssociation(id) {
        const associations = JSON.parse(localStorage.getItem(associationKey));
        const association = associations.find((a) => a.id === id);

        if (!association) {
            alert('Association not found.');
            return;
        }

        $('#association-id').val(association.id);
        $('#association-name').val(association.name);
        $('#association-reg').val(association.reg);
        $('#association-address').val(association.address);
        $('#association-photo').val('');

        hideAllSections();
        updateBreadcrumb('Edit Association');
        $('#association-form-section').removeClass('hidden');
    }

    // Save an association
    function saveAssociation() {
        if (!validateAssociationForm()) return;

        const id = $('#association-id').val();
        const name = $('#association-name').val().trim();
        const reg = $('#association-reg').val().trim();
        const address = $('#association-address').val().trim();
        const photoFile = $('#association-photo')[0].files[0];

        const associations = JSON.parse(localStorage.getItem(associationKey));

        const reader = new FileReader();
        reader.onload = function (e) {
            const photo = e.target.result;

            if (id) {
                const index = associations.findIndex((a) => a.id === id);
                if (index !== -1) {
                    associations[index] = { id, name, reg, address, photo };
                } else {
                    alert('Association not found. Please refresh the list.');
                    return;
                }
            } else {
                associations.push({
                    id: new Date().getTime().toString(),
                    name,
                    reg,
                    address,
                    photo,
                });
            }

            localStorage.setItem(associationKey, JSON.stringify(associations));
            loadAssociations();
            hideAllSections();
            $('#associations-section').removeClass('hidden');
            updateBreadcrumb('');
        };

        if (photoFile) {
            reader.readAsDataURL(photoFile);
        } else {
            saveWithoutPhoto();
        }

        function saveWithoutPhoto() {
            if (id) {
                const index = associations.findIndex((a) => a.id === id);
                if (index !== -1) {
                    associations[index] = { id, name, reg, address };
                } else {
                    alert('Association not found. Please refresh the list.');
                    return;
                }
            } else {
                associations.push({
                    id: new Date().getTime().toString(),
                    name,
                    reg,
                    address,
                });
            }

            localStorage.setItem(associationKey, JSON.stringify(associations));
            loadAssociations();
            hideAllSections();
            $('#associations-section').removeClass('hidden');
            updateBreadcrumb('');
        }
    }

    // Delete an association
    function deleteAssociation(id) {
        let associations = JSON.parse(localStorage.getItem(associationKey));
        associations = associations.filter((a) => a.id !== id);
        localStorage.setItem(associationKey, JSON.stringify(associations));
        localStorage.removeItem(`${memberPrefix}${id}`);
        loadAssociations();
    }

    // Export all associations
    function exportAllAssociations() {
        const associations = JSON.parse(localStorage.getItem(associationKey));
        const zip = new JSZip();

        associations.forEach((association) => {
            const members = JSON.parse(localStorage.getItem(`${memberPrefix}${association.id}`)) || [];
            zip.file(`${association.name}.json`, JSON.stringify({ association, members }));
        });

        zip.generateAsync({ type: 'blob' }).then((content) => {
            saveAs(content, 'associations.zip');
        });
    }

    // Import all associations
    function importAllAssociations(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            JSZip.loadAsync(e.target.result).then((zip) => {
                zip.forEach((relativePath, file) => {
                    file.async('string').then((data) => {
                        const { association, members } = JSON.parse(data);
                        saveImportedAssociation(association, members);
                    });
                });
            });
        };
        reader.readAsArrayBuffer(file);

        function saveImportedAssociation(association, members) {
            const associations = JSON.parse(localStorage.getItem(associationKey));
            if (!associations.some((a) => a.id === association.id)) {
                associations.push(association);
                localStorage.setItem(associationKey, JSON.stringify(associations));
                localStorage.setItem(`${memberPrefix}${association.id}`, JSON.stringify(members));
                loadAssociations();
            }
        }
    }

    function navigateToMembers(associationId) {
        const associations = JSON.parse(localStorage.getItem(associationKey));
        const association = associations.find(a => a.id === associationId);
        const members = JSON.parse(localStorage.getItem(`${memberPrefix}${associationId}`)) || [];

        if (!association) {
            alert('Association not found.');
            return;
        }

        hideAllSections();
        updateBreadcrumb(`${association.name} > Members`);
        $('#members-section-title').text(`Members of ${association.name}`);
        $('#members-section').data('association-id', associationId).removeClass('hidden');
        $('#members-section').data('association-name', association.name).removeClass('hidden');
        loadMembers(members);
    }

    function editMember(id) {
        const associationId = $('#members-section').data('association-id');
        const associationName = $('#members-section').data('association-name');
        const membersKey = `${memberPrefix}${associationId}`;
        const members = JSON.parse(localStorage.getItem(membersKey)) || [];
        const member = members.find(m => m.id === id);

        if (!member) {
            alert('Member not found.');
            return;
        }
        $('#section-title').text(`${associationName}`);

        $('#member-id').val(member.id);
        $('#member-name').val(member.name);
        $('#member-admission').val(member.admission);
        $('#member-father').val(member.father);
        $('#member-address').val(member.address);
        $('#member-community').val(member.community);
        $('#member-gender').val(member.gender);
        $('#member-photo').val('');

        hideAllSections();
        updateBreadcrumb('Edit Member');
        $('#member-form-section').removeClass('hidden');
    }

function saveMember() {
    const id = $('#member-id').val();
    const associationId = $('#members-section').data('association-id');
    const name = $('#member-name').val().trim();
    const admission = $('#member-admission').val().trim();
    const father = $('#member-father').val().trim();
    const address = $('#member-address').val().trim();
    const community = $('#member-community').val();
    const gender = $('#member-gender').val();
    const photoFile = $('#member-photo')[0].files[0];

    const membersKey = `${memberPrefix}${associationId}`;
    const members = JSON.parse(localStorage.getItem(membersKey)) || [];

    // Validate mandatory fields
    if (!name || !admission || !community || !address || !gender) {
        alert('Name, Admission Number, Community, Address, and Gender are mandatory fields.');
        return;
    }

    // Check for duplicate admission number
    const duplicate = members.some(
        (m) => m.admission === admission && m.id !== id
    );
    if (duplicate) {
        alert('Admission Number must be unique.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const photo = e.target.result;

        if (id) {
            const index = members.findIndex((m) => m.id === id);
            if (index !== -1) {
                members[index] = {
                    id,
                    name,
                    admission,
                    father,
                    address,
                    community,
                    gender,
                    photo,
                };
            } else {
                alert('Member not found. Please refresh the list.');
                return;
            }
        } else {
            members.push({
                id: new Date().getTime().toString(),
                name,
                admission,
                father,
                address,
                community,
                gender,
                photo,
            });
        }

        localStorage.setItem(membersKey, JSON.stringify(members));
        loadMembers(members);
        hideAllSections();
        $('#members-section').removeClass('hidden');        
    };

    if (photoFile) {
        reader.readAsDataURL(photoFile);
    } else {
        saveWithoutPhoto();
    }

    function saveWithoutPhoto() {
        if (id) {
            const index = members.findIndex((m) => m.id === id);
            if (index !== -1) {
                members[index] = {
                    id,
                    name,
                    admission,
                    father,
                    address,
                    community,
                    gender,
                };
            } else {
                alert('Member not found. Please refresh the list.');
                return;
            }
        } else {
            members.push({
                id: new Date().getTime().toString(),
                name,
                admission,
                father,
                address,
                community,
                gender,
            });
        }

        localStorage.setItem(membersKey, JSON.stringify(members));
        loadMembers(members);
        hideAllSections();
        $('#members-section').removeClass('hidden');        
    }
    updateBreadcrumb('');
}


    function deleteMember(id) {
        const associationId = $('#members-section').data('association-id');
        const membersKey = `${memberPrefix}${associationId}`;
        let members = JSON.parse(localStorage.getItem(membersKey)) || [];

        members = members.filter(m => m.id !== id);
        localStorage.setItem(membersKey, JSON.stringify(members));
        loadMembers(members);
    }

    // Load members and render them in the list
    function loadMembers(members) {
        $('#members-list').empty();

        members.forEach((member) => {
            const photo = member.photo || './assets/placeholder.png';
            $('#members-list').append(`
                <div class="member-card">
                    <div class="member-details">
                        <img src="${photo}" alt="${member.name}" class="member-thumbnail">
                        <div class="member-info">
                            <h3>${member.name}</h3>
                            <p><strong>Admission No:</strong> ${member.admission}</p>
                            <p><strong>Father's Name:</strong> ${member.father}</p>
                            <p><strong>Community:</strong> ${member.community}</p>
                            <p><strong>Gender:</strong> ${member.gender}</p>
                            <p><strong>Address:</strong> ${member.address}</p>
                        </div>
                    </div>
                    <div class="member-actions">
                        <button onclick="editMember('${member.id}')">Edit</button>
                        <button onclick="deleteMember('${member.id}')">Delete</button>
                    </div>
                </div>
            `);
        });
    }


    function clearMembersForm(){
        $('#member-id').val('');
        $('#member-name').val('');
        $('#member-admission').val('');
        $('#member-father').val('');
        $('#member-address').val('');
        $('#member-community').val('');
        $('#member-gender').val('');
        $('#member-photo').val('');
    }

        function generatePDF(associationId) {
            const associations = JSON.parse(localStorage.getItem('associations'));
            const association = associations.find((a) => a.id === associationId);
            let members = JSON.parse(
                localStorage.getItem(`members-${associationId}`)
            ) || [];

            // Sort members by admission number, and move no-photo entries to the end
            members = members.sort((a, b) => {
                if (!a.photo && b.photo) return 1;
                if (a.photo && !b.photo) return -1;
                return a.admission.localeCompare(b.admission);
            });

            const formattedDate = new Date().toLocaleDateString();

            // Placeholder image
            const placeholderImage =
                    'data:image/png;base64,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';


            const placeholderWhiteImage =
                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAJCAYAAAD+WDajAAAYTWlDQ1BJQ0MgUHJvZmlsZQAAWIWVeQk4lV3X/77PfI75HPM8z2Se53meZxKO6ZjiGEOJJGOiQkglGSuVQiUiDUoZekiSSIZKoaJC9d2Gep73ef/X/7u+fV373r+z9tprrb3WHu51bgC4qnwjI8MQjACER8RQHUwN+N3cPfixc4AG0AIGIApIvuToSH07OysAl9/tf5aVYQBttE9lNmT9d///tzD5B0STAYDsYOznH00Oh/FVAFDl5EhqDACYDbpQfEzkBoYrYKbCBsI4cwMHbeHyDey3hS9t8jg5GMK4GwAcra8vNQgA+n6Yzh9HDoJl0C/CfcQIf0oEACwoGOuEh+/2B4DLCOYRh3kiYbwxDzW/f8gJ+g+Zfn9k+voG/cFbc9ksOCNKdGSY757/ozv+9xIeFvtbhyhcaYOpZg4bc4b9NhK623ID08J4PsLPxhbGRBh/o/hv8sMYQQiONXPe4kdwk6MNYZ8BVhjL+fsaWcKYG8YmEWE2Vtt0v0CKiTmM4RWCSKDEmDvBmB3GmQHRxo7bPKepux22dSGaA6mG+tv0B77UTb0busZjQ531t+V/Cg4w35aPpE8MdnKFMQHGwnEUFxsY08NYNjrU0XKbRysx2NDmNw811mHDfmEYOwREmBpsyUfGBVJNHLb5s8Ojf88XeTqYYm6zja/EBDuZbfkH2U323bQfnguyPyBC3/m3nIBoN6vfc/EPMDLemjtyLiDC2XFbzrfIGAOHrbEoQmSY3TY/SjAgzHSDLghjpeg4x+2xKJcYeEFuyUcFRsbYOW3ZiUoM8bWw27IHdQRYAUNgBPhBLFz9wG4QAihP5lvm4V9bPSbAF1BBEAgAMtuU3yNcN3si4KcjSAQfYBQAov+MM9jsDQBxMP3HH+rWUwYEbvbGbY4IBTMwDgeWIAz+Hbs5KuKPNhfwBqZQ/ku7L1zJsL1hcN3o/3/Tf1P/pujDFKttSuxvjfwMvzkxxhgjjBnGBCOB4kTpoDRRVvBTD64KKDWU+u95/M2PnkEPoF+jh9AT6Oe7KGnUf1lpDSZg+SbbvvD7py9QorBMZZQBShuWDktGsaI4gQxKCdajj9KFNSvDVMNtuze8wv8v2f8xg39EY5sPL4dH4Nnwenjxf4+kl6RX/iNlw9f/9M+WrX5//G34p+ff+g3/4X1/uLX8NycyE9mEvI/sRPYg25AtgB/ZgWxF9iJvbeA/q+vN5ur6rc1h055QWA7lv/T9juyGJ6PlGuTeyq1v9cUEJGyc0cBwd+QeKiUoOIZfH74RAvjNI8iy0vwKcgpKAGzcL1vH12eHzXsDYu37m0Y+CIAqfD7jV/+mhX8G4BK89/mt/6aJeMPbDwNA7Qw5lhq3RUNtPNDwKcEA7zQOwAuEgDg8HwWgAjSBHjAGFsAWOAF34A1bHwyvcyqIB8kgFWSAHHAEHAel4BQ4C2rBBXAFtIA20AnugUegHwyBF/DqmQbvwSJYAWsQBGEhOogEcUB8kAgkBSlAapAOZAxZQQ6QO+QDBUERUCyUDB2AcqBCqBQ6A9VBl6HrUCfUAw1Az6FJ6C30CVpFIBG0CGYED0IUsQOhhtBHWCKcEDsRQYgoRCIiHXEYUYKoRJxHNCM6EY8QQ4gJxHvEMhIgaZCsSAGkDFINaYi0RXogA5FU5D5kNrIIWYm8iLwBx/kpcgI5j/yOwqBIKH6UDLyCzVDOKDIqCrUPlYsqRdWimlHdqKeoSdQi6ieaDs2NlkJroM3RbuggdDw6A12ErkZfQ9+F99I0egWDwbBixDCq8F50x4RgkjC5mJOYRsxtzABmCrOMxWI5sFJYbawt1hcbg83AnsCex3ZgB7HT2G84GhwfTgFngvPAReDScEW4elw7bhA3i1vDM+JF8Bp4W7w/fg8+H1+Fv4Hvw0/j1whMBDGCNsGJEEJIJZQQLhLuEsYIn2loaARp1GnsaSg0+2lKaC7RPKCZpPlOS6SVpDWk9aKNpT1MW0N7m/Y57Wc6OjpROj06D7oYusN0dXR36MbpvtGT6GXpzen96VPoy+ib6QfpPzLgGUQY9Bm8GRIZihiaGPoY5hnxjKKMhoy+jPsYyxivMz5jXGYiMckz2TKFM+Uy1TP1MM0RsURRojHRn5hOPEu8Q5wiIUlCJEMSmXSAVEW6S5pmxjCLMZszhzDnMF9gfsK8yEJkUWJxYUlgKWO5xTLBimQVZTVnDWPNZ73COsy6ysbDps8WwJbFdpFtkO0rOxe7HnsAezZ7I/sQ+yoHP4cxRyhHAUcLx0tOFKckpz1nPGcF513OeS5mLk0uMlc21xWuUW4EtyS3A3cS91nuXu5lHl4eU55InhM8d3jmeVl59XhDeI/xtvO+5SPx6fBR+I7xdfC942fh1+cP4y/h7+ZfFOAWMBOIFTgj8ERgTVBM0FkwTbBR8KUQQUhNKFDomFCX0KIwn7C1cLJwg/CoCF5ETSRYpFjkvshXUTFRV9FDoi2ic2LsYuZiiWINYmPidOK64lHileJ/SWAk1CRCJU5K9EsiJJUlgyXLJPukEFIqUhSpk1ID0mhpdekI6UrpZzK0MvoycTINMpOyrLJWsmmyLbIfdwjv8NhRsOP+jp9yynJhclVyL+SJ8hbyafI35D8pSCqQFcoU/lKkUzRRTFFsVVxSklIKUKpQGlEmKVsrH1LuUv6hoqpCVbmo8lZVWNVHtVz1mRqzmp1artoDdbS6gXqKepv6dw0VjRiNKxoLmjKaoZr1mnNaYloBWlVaU9qC2r7aZ7QndPh1fHRO60zoCuj66lbqvtYT0vPXq9ab1ZfQD9E/r//RQM6AanDN4KuhhuFew9tGSCNTo2yjJ8ZEY2fjUuNxE0GTIJMGk0VTZdMk09tmaDNLswKzZ+Y85mTzOvNFC1WLvRbdlrSWjpallq+tJK2oVjesEdYW1ketx2xEbCJsWmyBrbntUduXdmJ2UXY37TH2dvZl9jMO8g7JDvcdSY67HOsdV5wMnPKdXjiLO8c6d7kwuHi51Ll8dTVyLXSdcNvhttftkTunO8W91QPr4eJR7bHsaex53HPaS9krw2t4p9jOhJ093pzeYd63djHs8t3V5IP2cfWp91n3tfWt9F32M/cr91skG5KLye/99fyP+b8N0A4oDJgN1A4sDJwL0g46GvQ2WDe4KHieYkgppSyFmIWcCvkaahtaE/orzDWsMRwX7hN+PYIYERrRvZt3d8LugUipyIzIiSiNqONRi1RLanU0FL0zujWGGX6R740Vjz0YOxmnE1cW9y3eJb4pgSkhIqF3j+SerD2ziSaJ55JQSeSkrmSB5NTkyb36e8/sg/b57etKEUpJT5neb7q/NpWQGpr6OE0urTDtywHXAzfSedL3p08dND3YkEGfQc14dkjz0KlMVCYl80mWYtaJrJ/Z/tkPc+RyinLWc8m5D/Pk80ryfh0OPPwkXyW/4gjmSMSR4QLdgtpCpsLEwqmj1kebj/Efyz725fiu4z1FSkWnignFscUTJVYlrSeETxw5sV4aXDpUZlDWWM5dnlX+9aT/ycEKvYqLp3hO5ZxaPU05PXLG9ExzpWhl0VnM2bizM1UuVffPqZ2rq+aszqn+URNRM1HrUNtdp1pXV89dn9+AaIhteHve63z/BaMLrRdlLp5pZG3MuQQuxV56d9nn8vAVyytdTWpNF6+KXC2/RrqW3Qw172lebAlumWh1bx24bnG964bmjWs3ZW/WtAm0ld1iuZXfTmhPb//VkdixfDvy9nxnUOdU166uF3fc7vzVbd/95K7l3Qf3TO7dua9/v+OB9oO2Ho2e6w/VHrY8UnnU3Kvce+2x8uNrT1SeNPep9rX2q/ffGNAaaB/UHex8avT03l/mfz0ashkaGHYeHnnm9WxixH9k7nnY86XRuNG1F/vH0GPZLxlfFo1zj1e+knjVOKEycWvSaLL3tePrF1Pkqfdvot+sT6fP0M0UzfLN1s0pzLW9NXnb/87z3fT7yPdr8xkfmD6UfxT/eHVBb6F30W1xeom69OtT7meOzzVflL50Ldstj6+Er6x9zf7G8a32u9r3+6uuq7Nr8evY9ZIfEj9u/LT8OfYr/NevSF+q7+arABKuiMBAAD7VAEDnDgAJzs8Inlv533ZBwi8fCLh1gWSh94h0+EbtQ2WgTTBIzCNsCS4Cb0WQoMHSzNMO0rXQ1zBUMzYytRK7SI+Y+1lGWF+xzbG/51jiXOX6wYPgxfIR+OkEiIJEIVZhdhE2UXYxbnEeCX5JfilBaWEZUVmxHdJycvKKCiqKGkq6ysYq5qrmaibqJhommoZa+tpaOhq6Snqy+qIGPIbMRgSjX8afTWZMn5v1mrdZ1FoetUqxDrFxszW2U7YXc+ByZHTCOSNdIFeEG8od78HoyeElvFPGW2KXsA+fL6cfC5nkTwwgBbIGcQULUqRDVENNwlzCKRHJuwsjq6JOU0uiC2JyY7PisuMPJ5TsqU1sT3qxF+yTTtm1/0TqiwOC6bsPdh7CZAplKWQb5DjmBuYlHi7Irz1yu2C0cPkY03GZIoviwJIDJypKr5cNlr85uXwKe5rjjGSl1lnbKr9zMdUHa4pqa+uu1z9sGD3/7sL3RtwltsviV3Sb3K9GXctqPtnS2NpxvedG383+tke3utovd5TdTunc1aVxh3hnpvv63fp75fdzHiT0+D00fyTbS987//juk/K+yH6DAdLA1OCVp6l/2Q+JDKOG3z7rHWl8Xjga88JlTO0l58v18fFXnRPnJrNe755yfqM1LQyvspXZv+auvi1+l/I+bJ78gfwxciFn8drSwme9L2dWSF9LvkutPllP+anx69c/4q+AnEMVoi0xLJiX2CZcLj6IYEQjSctAu043Sz/CMML4iukN8QPpM/MKyw/WNbYf7D85fnCucH3mXuCZ4R3jG+S/K3BdsFooRzhMxEpUUgwv9k68R6JOMluKIm0pIyNLJ7uwY0DuqnyxQrIiWcle2UBFQVVAjaj2S/2jxphmj1azdqVOrm68no++hYGCIacRwuit8ROTS6YFZtHmThYqlmyWa1avrO/Y1NsW2CXZBzo4Ouo7yTsLuJBcsa6rbu/dxzx6PW95Ne487X101yGfZF+qH4Xs6+8R4BRoH2QTbEmxDDEL1QyTDReIYNlNE4mIXI/6Rv0e/SMWHUeMF0rQ2OOUGJ1UlNy2dyaFZj9fqkya9gGbdL+D8Rl5h6ozO7JGs7/mMucpHLbPjziSV9BQ+ODom2O/ijiLlUvsToSWHiw7Vd56sr9i7tTPM8yVEme1q+zOkatjaw7VlsDnXG/DwgXiRcVGx0tRl/OvNDR1Xx279qkF08pxXfKGxk2LNrdbge0xHSm3UzsPdB28k9F96G7mvez7uQ/yevIe5j3K6819nPMkq+9Qf/pA6uDep3F/RQ3tHo58FjOS9Pzg6NEXlWNNL++NP3/1YRK8Jk4JvpGf1pkxn/WbO/32w3vl+aQP7R9/LmouxX26+PnNMvuK5deUb03fZ9e41x1+ZP/s3o6/MUIfuQP5EdWJPoRxxIpjl3DX8RkEBxpumnHas3Th9OoMCIZOxnQmCyIDsZ90hNmWhYHlMWs2mwk7xN7KEcEpxDnClcOtw/2Bp4zXjPcLXwW/Gf9HgWOCGoJjQnuF+YXbRbxF1kVLxJTEesUDxNcljkpKSXZIOUrNSKfKiMiMyObuMNjxRa5G3lOBTqFDMVJJQGlQOU1FQWVSNV9NW+2DepmGucay5lkte62f2g067rpY3Wt6ZH2i/m2DSEN+w36jNGMl41mTUlNb+L3jpnmUhZTFG8sKKw9rVuunNoW2DnYku2H7Ew7ejsKO75wuOye6GLsyuI66VbtHexh40noOe53aGeyt4L22665Pga+Xn4TfCrnb/2iAb6BiECpoOLiekhLiFCodhg57FX4jomR3fKRrlAaVNxoVPR8zFNsZ1xhfkZC/JzUxPik02X/vzn1uKU77HVLt0+wPOKQ7HXTP2HkoIDM0Kzo7JScztzCv4nBdfvOROwUDheNHPx5HFUkUe5UcOXG3dK1c9qRfxfFTD0+vVyqcDagqPddXg6rVqouvb2x4f0HyYkhj/aWFKypN+6/2NnO0hLV23+C7mdL2ut2qo61Tvut8t9Tdy/cNHow+TOjle9zflzfg9FR0CAy/H3kz+u4leCUyuWuqfgY9l/gefKhaJH/WXVH77rxeshH/rf8BNwpGBYDjhwDY+J/HoQ6A3PMAiO0BgA3OPe3oAHBSBwgBUwAtdwHIQvvP/QHBiScBkAAPkARqwAzOL8PgnLIYNIIeMAV+QOyQMuQIRUPHoVboJZzzSSNcEKmIRsQ4kgFpgIxHXkDOwFmaF6oM9QLOxHzQ59AfMCqYVMwTLA82HNuBI+EouE48Jz4WP0hQJBQT1mnINI9p1Wlr6djpcukR9En0XxliGVYYE5kgpmwiK7GKpEbqZw5hwbKcYzVmnWHLZJdi7+eI4eTgbOfy56bhvsLjwYvkvcDnCWcEAwL5grZCTEJPhYtFPEUFRGfEzotHS2hIQpI9UgXSnvDqXJQd3NEmVy1fqLBPkaLkqKyhwqcKqU6otakf0wjR1Nai1xrTrtOJ0dXVw+kN6DcZXDVsMbph3G5yx7THrM982GLcctZqyXrNFmfHai/qoOZo5UR2TnYpcW13m/Mgeep7Re6s9B7yIfjq+yWRW/2/BqoFJQV3hhBCncOqwpd3m0VWRC1Ea8XkxI7HKyUc2bOU5Jp8b592SnuqZdpUelaGdibIGsi5lFeeX1hgdhR57G5RQUlAqWG5dIXgaZFKpSqb6qjasvpHF0Cj6mWbJvdrwS3J14/fvHJrsGOli7fb7F7Mg9MPn/T+6JMZ2Pn08NDtEdIoeezC+Pwk95TatN6s/Fv6d8/mD3/csdC5ZPap+4vCcunK6jf77+dWl9Y1fqT8vL15fmzFnwjHXwKoAhPgCkLAPnAMNIBuMA6+QSRIDrKBIqAjUBP0HAEQEnCWn4a4jHgN5/FWyHRkB3INpY06gOpFs6MD0c0YPMYb04xlxIZhH+Gkcfm4ZbwX/h5BllBMg6SJopmkdaZ9SGdI106vRX8LzmIfMNozjsN56i/iMZIs6TFzBJx5trL6stGwtbIHcrBy3OfcwyXNNcldzGPLi+Pt4tvPbyCAEXgsWCTkKywrvC7SK1ohFiVuLMEl8UnyodRZ6RQZT1nNHRJy7PJ4+XWFBcUppWfKD1Vuqp5XK1U/pEHV9NQy1JbUYdRZ1h3Va9dvNLhs2GTUYnzTpMO02+yheb/FM8tXVrPWSzZrdjh7VgcxR3Una2d/l72upW7X3Uc9fngJ7rTwjtl12qfPDyKr+EcE1AXOBItSQkIuh66Gm0YU7Z6L0qLuje6IRcVZxRcnzCSqJx1Ont1nnFKbSp+258AsfJ70Z1pk3c8xy+097JA/UZBylPfY7aLAEvoTrWX+J0kV907vrVQ5++nc5ZrYOq0GzPmhi+cuJV/xuqrSTN8ydf3qzQO3bDrYb0921XVT72k9wPYMP6p7vL/Pa0DnqcgQ0/CDEefn0y8SXzKPX5lwmlyfqp12n2WY63mXOW/5kXHh2dLpzyHLKl8R3/pWy9aDfipuxx8JMIB28wQQByrwCnAD4eAgOAVuglF4/wtCFlAsVAUNI2gQRvDO70LikPbIU8hPKAtUDRqPpqJfYZzg3W6DHcKRcd/xRQR1wjTNCVo92jG6JHp++h6GeEZJximmU0Q/kgTpK/N9lgrWJDZPdj0OKU52LhpuBPc6zyrvOj8QwMJvoDzCsiLaog5iQeL7JU5IXoPz7kVZxh0Kcq7y+xSqFPuU1lQkVN3VCtUHNZm13LWrdBb0tPXzDF4ZKRrnmEyaaZkXWXyysrO+YEtrF2b/0FHSKcf5nauFW70H3pPidd9bdNdBn2k/Q3J1ADLQP+gORTQkI3Qu3CqiMZIlKoE6EWMUezGePWHfnvdJbvA+VUmpSeVIO5yOOpic8SnTI+ty9q9cp7yaw6tHHAsuHiUcoxy/VyxVkntiocy1/FaF6KkC+Oz3P9t7TrO6ppapLrF+5rzjhbZG0Uv5l1eavK/ea5ZpOdK6eMP+5sVbhPbAjvZOYlfAnea7qHt298seTD2UeETprX482cfZbz9wcPDq09dDhGG5Zw4j1OeHR+te3BkbejkzvvRqfRJ6jZ3CvMFMg+nVmQ+z43OP37a+q3yfOR/xwfqj1AJ24dVi61LWJ4/PEp8/fWlbTlsx+or52v0t5bvm96XVc2se64T15h/kn3Q/r/xy34j/1rejzfuDEYDTXBto4NKnj//+brP1Xekfucm/W7B5u2yUjdtls4VvGvA/VWjQ3dPcDXQAAABWZVhJZk1NACoAAAAIAAGHaQAEAAAAAQAAABoAAAAAAAOShgAHAAAAEgAAAESgAgAEAAAAAQAAAAegAwAEAAAAAQAAAAkAAAAAQVNDSUkAAABTY3JlZW5zaG904QJWrwAAAdJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDYuMC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+OTwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj43PC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6VXNlckNvbW1lbnQ+U2NyZWVuc2hvdDwvZXhpZjpVc2VyQ29tbWVudD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+Ci8fYZUAAAAWSURBVBgZY/wPBAw4ABMOcbDwMJIEABBkBA5Ff0lrAAAAAElFTkSuQmCC';


             const generateMemberRows = () => {
                const rows = [];

                for (let index = 0; index < members.length; index += 2) {
                    const member1 = members[index];
                    const member2 = members[index + 1]; // This may be undefined if it's the last odd member

                    // First member data
                    const admission1 = `Admn No:   ${member1.admission || "-"}`;
                    const name1 = `Name:   ${member1.name || "-"}`;
                    const fatherName1 = `Father's Name:   ${member1.father || "-"}`;
                    const address1 = `Address:   ${member1.address || "-"}`;
                    const community1 = `Community:   ${member1.community || "-"}`;
                    const gender1 = `Gender:   ${member1.gender || "-"}`;
                    const photo1 = member1.photo || placeholderImage;

                    // Second member data (if it exists)
                    const admission2 = member2 ? `Admn No:   ${member2.admission || "-"}` : "";
                    const name2 = member2 ? `Name:   ${member2.name || "-"}` : "";
                    const fatherName2 = member2 ? `Father's Name:   ${member2.father || "-"}` : "";
                    const address2 = member2 ? `Address:   ${member2.address || "-"}` : "";
                    const community2 = member2 ? `Community:   ${member2.community || "-"}` : "";
                    const gender2 = member2 ? `Gender:   ${member2.gender || "-"}` : "";
                    const photo2 = member2 ? member2.photo || placeholderImage : placeholderImage; // Use placeholder if no second member

                    // Push a row with two members or one member + empty placeholders
                    rows.push([
                        {
                            text: [
                                `${index + 1}. \n\n`,
                                { text: "Admission No.:   ", bold: true }, `${admission1}\n`,
                                { text: "Name:   ", bold: true }, `${name1}\n`,
                                { text: "Father's Name:   ", bold: true }, `${fatherName1}\n`,
                                { text: "Address:   ", bold: true }, `${address1}\n`,
                                { text: "Community:   ", bold: true }, `${community1}\n`,
                                { text: "Gender:   ", bold: true }, `${gender1}\n`
                            ],
                            fontSize: 10,
                            alignment: "left",
                            margin: [5, 5, 5, 5],
                        },
                        {
                            image: photo1,
                            fit: [70, 70],
                            alignment: "center",
                            margin: [25, 25, 1, 5],
                        },
                        {
                            text: member2 ? [
                                `${index + 2}. \n\n`,
                                { text: "Admission No.:   ", bold: true }, `${admission2}\n`,
                                { text: "Name:   ", bold: true }, `${name2}\n`,
                                { text: "Father's Name:   ", bold: true }, `${fatherName2}\n`,
                                { text: "Address:   ", bold: true }, `${address2}\n`,
                                { text: "Community:   ", bold: true }, `${community2}\n`,
                                { text: "Gender:   ", bold: true }, `${gender2}\n`
                            ] : "", // Empty text if no second member
                            fontSize: 10,
                            alignment: "left",
                            margin: [5, 5, 5, 5],
                        },
                        {
                            image: member2? photo2: placeholderWhiteImage,
                            fit: [70, 70],
                            alignment: "center",
                            margin: [25, 25, 1, 5],
                        },
                    ]);
                }

                return rows;
            };


            const pageHeader = [
                { text: association.name.toUpperCase(), alignment: 'center', bold: true, fontSize: 16 },
                { text: `Regd. No: ${association.reg}`, alignment: 'center', fontSize: 12 },
                { text: association.address.toUpperCase(), alignment: 'center', fontSize: 12 },
                { text: `LIST OF MEMBERS ELIGIBLE TO VOTE: ${formattedDate.toUpperCase()}`, alignment: 'center', bold: true, fontSize: 12, margin: [0, 10, 0, 10] },
            ];

            const rowsPerPage = 5;
            const memberRows = generateMemberRows();
            const tableRows = [];
            for (let i = 0; i < memberRows.length; i += rowsPerPage) {
                tableRows.push({
                    table: {
                        widths: ["35%", "15%", "35%", "15%"],
                        body: memberRows.slice(i, i + rowsPerPage),
                    },
                    pageBreak: i + rowsPerPage < memberRows.length ? "after" : undefined,
                });
            }

            const content = [
                ...pageHeader,
                tableRows
            ];

            pdfMake.createPdf({
                pageSize: "A4",
                content,
                pageMargins: [20, 40, 20, 40],
                styles: {
                    header: { fontSize: 14, bold: true },
                    subheader: { fontSize: 12, bold: true },
                    small: { fontSize: 10 },
                },
            }).download(`Voter List - ${association.name}.pdf`);
        }


        

    window.editAssociation = editAssociation;
    window.saveAssociation = saveAssociation;
    window.deleteAssociation = deleteAssociation;
    window.exportAllAssociations = exportAllAssociations;
    window.importAllAssociations = importAllAssociations;
    window.navigateToMembers = navigateToMembers;
    window.editMember = editMember;
    window.saveMember = saveMember;
    window.deleteMember = deleteMember;
    window.generatePDF = generatePDF;
    window.loadMembers = loadMembers;      

    initializeData();

    $('#add-association-btn').click(() => {
        hideAllSections();
        updateBreadcrumb('Add Association');
        clearAssociationForm();
        $('#association-form-section').removeClass('hidden');
    });

    $('#save-association').click(saveAssociation);

    $('#cancel-association').click(() => {
        hideAllSections();
        $('#associations-section').removeClass('hidden');
        updateBreadcrumb('');
    });

    $('#export-all-btn').click(exportAllAssociations);

    $('#import-all-btn').click(() => {
        $('#import-all-file').click();
    });

    $('#import-all-file').change(function () {
        const file = this.files[0];
        importAllAssociations(file);
    });

    $('#back-to-associations').click(() => {
        hideAllSections();
        $('#associations-section').removeClass('hidden');
        updateBreadcrumb('');
    });   

    $('#add-member-btn').click(() => {
        hideAllSections();
        updateBreadcrumb('Add Member');
        const associationName = $('#members-section').data('association-name');
        $('#section-title').text(`${associationName}`);
        clearMembersForm();
        $('#member-form-section').removeClass('hidden');
    });

    $('#save-member').click(saveMember);
    $('#cancel-member').click(() => {
        hideAllSections();
        $('#members-section').removeClass('hidden');
        updateBreadcrumb('');
    });

    $('#back-to-members').click(() => {
        hideAllSections();
         $('#members-section').removeClass('hidden');
        updateBreadcrumb('');
    });       
});